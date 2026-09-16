import type { APIContext } from 'astro';
import { devFileBytes, getFile, getProject } from '../../../../lib/dev/projects';
import { mimeType } from '../../../../lib/dev/mime';
import { notFound } from '../../../../lib/dev/notFound';

// Публичная отдача сайта проекта: /dev/all/<slug>/<путь>. Пароль не нужен — клиент
// получает ссылку от Витала. Работает, только пока проект включён на /dev/all.
//
// Адрес → файл (ТЗ 2026-09-15 §4):
//   /dev/all/<slug>          → site/index.html
//   /dev/all/<slug>/<путь>   → site/<путь>, если такой файл есть, иначе site/<путь>.html
//   адреса с .html и с «/» на конце → 301 на чистый адрес
// Выключенный проект, несуществующий проект и несуществующий файл отдают ОДИН И ТОТ ЖЕ 404
// (страница 404 сайта) — по ответу нельзя понять, что проект есть.
// X-Robots-Tag на все ответы под /dev ставит src/middleware.ts.
export const prerender = false;

function redirect(to: string, url: URL): Response {
	return new Response(null, {
		status: 301,
		headers: { Location: to + url.search, 'Cache-Control': 'no-store' },
	});
}

/**
 * Разбор заголовка Range. KV, в отличие от R2, диапазоны не умеет — режем сами.
 * Кривой или составной заголовок по стандарту игнорируется (обычные 200),
 * диапазон за концом файла — 416, корректный — 206 с куском тела.
 * Возвращает границы включительно или 'unsatisfiable'.
 */
function resolveRange(header: string | null, size: number): { start: number; end: number } | 'unsatisfiable' | null {
	const m = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
	if (!m) return null;
	const [, from, to] = m;
	if (from === '') {
		const suffix = to === '' ? NaN : Number(to);
		if (!Number.isFinite(suffix) || suffix === 0) return Number.isFinite(suffix) ? 'unsatisfiable' : null;
		return { start: Math.max(0, size - suffix), end: size - 1 };
	}
	const start = Number(from);
	if (start >= size) return 'unsatisfiable';
	const end = to === '' ? size - 1 : Math.min(Number(to), size - 1);
	if (end < start) return null;
	return { start, end };
}

async function serve(context: APIContext): Promise<Response> {
	const { params, request, url } = context;
	const slug = params.slug || '';
	const rel = params.path || '';

	// Сначала доступ, потом всё остальное: у выключенного проекта даже редиректов нет.
	const project = await getProject(slug);
	if (!project || !project.enabled) return notFound(url);

	const base = `/dev/all/${slug}`;
	const segments = rel.split('/');
	if (segments.some((s) => s === '..' || s === '.' || s.includes('\\'))) return notFound(url);

	if (url.pathname.length > base.length && url.pathname.endsWith('/')) {
		return redirect(url.pathname.replace(/\/+$/, ''), url);
	}
	if (rel === 'index.html' || rel === 'index') return redirect(base, url);
	if (rel.endsWith('.html')) return redirect(`${base}/${rel.slice(0, -5)}`, url);

	// Кэш на границе Cloudflare. Чтение KV + раскодирование base64 давало 300–500 мс на ответ,
	// и это была главная потеря в PageSpeed у страниц, которые Витал показывает клиентам.
	// Ключ включает версию проекта: новая выгрузка не отдаёт старый кэш. Доступ проверен ВЫШЕ,
	// поэтому у выключенного проекта до кэша дело не доходит; живёт запись 60 секунд
	// (допустимая задержка переключателя — решение Витала 15.09.2026).
	const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
	const cacheable = request.method === 'GET' && !request.headers.has('range') && !request.headers.has('if-none-match');
	const cacheKey = new Request(`${url.origin}${url.pathname}?v=${project.version}`, { method: 'GET' });
	if (cache && cacheable) {
		const hit = await cache.match(cacheKey);
		if (hit) return hit;
	}

	// Страницы без расширения сначала ищем как <путь>.html — так на страницу один запрос к KV.
	const lastSegment = segments[segments.length - 1];
	const candidates = rel === '' ? ['index.html'] : lastSegment.includes('.') ? [rel, `${rel}.html`] : [`${rel}.html`, rel];

	for (const key of candidates) {
		const { value, metadata } = await getFile(project, key);
		if (!value) continue;

		// Размер исходного файла — из метаданных: значение в KV лежит в base64.
		const size = metadata?.size ?? Math.floor((value.length * 3) / 4);
		// ETag от скрипта выгрузки (хэш содержимого); нет метаданных — собираем из версии и размера.
		const etag = `"${metadata?.etag || `${project.version}-${size.toString(16)}`}"`;
		const headers = new Headers({
			'Content-Type': metadata?.contentType || mimeType(key),
			ETag: etag,
			'Accept-Ranges': 'bytes',
			'X-Content-Type-Options': 'nosniff',
			// Короткий кэш: после выключения проекта файлы не должны долго жить в браузере клиента.
			'Cache-Control': key.endsWith('.html') ? 'no-cache' : 'private, max-age=300',
		});

		const ifNoneMatch = request.headers.get('if-none-match');
		if (ifNoneMatch && ifNoneMatch.split(',').some((t) => t.trim().replace(/^W\//, '') === etag)) {
			return new Response(null, { status: 304, headers });
		}

		const range = resolveRange(request.headers.get('range'), size);
		if (range === 'unsatisfiable') {
			return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
		}
		const length = range ? range.end - range.start + 1 : size;
		if (range) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
		headers.set('Content-Length', String(length));
		// HEAD не декодирует тело: заголовки уже известны из метаданных.
		if (request.method === 'HEAD') return new Response(null, { status: range ? 206 : 200, headers });
		const bytes = devFileBytes(value);

		// ── ВРЕМЕННАЯ ЗАПЛАТКА 16.09.2026 (снять после перевыгрузки пакета estadel-krym) ──
		// В выложенной версии карта офиса вставляется скриптом страницы и не получает стили Astro,
		// поэтому iframe остаётся размером по умолчанию. В исходниках посадочных уже исправлено,
		// но перевыложить пакет нельзя: исчерпан суточный лимит записей KV (1000 на аккаунт).
		// Правило дописывается только этому проекту и только этой версии.
		if (!range && key.endsWith('.html') && slug === 'estadel-krym' && project.version === '2026-09-15') {
			// Приводим блок карты к виду из исходников: карта сразу видна, держит пропорцию 4:3
			// и не растягивается на всю высоту карточки (на высоком блоке виджет Яндекса
			// разворачивает внутри себя карточку организации поверх нашей).
			const patch =
				'<style>.about__map{aspect-ratio:4/3!important;min-height:0!important}' +
				'.about__map iframe{display:block;width:100%;height:100%;border:0}' +
				'.about__map-facade{display:none!important}</style>' +
				'<script>document.addEventListener("DOMContentLoaded",function(){' +
				'document.querySelectorAll(".about__map-facade").forEach(function(f){f.click()})});<\/script>';
			const html = new TextDecoder().decode(bytes).replace('</head>', patch + '</head>');
			const patched = new TextEncoder().encode(html);
			headers.set('Content-Length', String(patched.byteLength));
			const response = new Response(patched, { status: 200, headers });
			if (cache && cacheable) {
				const stored = response.clone();
				stored.headers.set('Cache-Control', 'public, max-age=60');
				await cache.put(cacheKey, stored);
			}
			return response;
		}

		const body = range ? bytes.subarray(range.start, range.end + 1) : bytes;
		const response = new Response(body, { status: range ? 206 : 200, headers });

		if (cache && cacheable) {
			// В кэш кладём копию с собственным сроком; браузеру уходит ответ со своими заголовками.
			const stored = response.clone();
			stored.headers.set('Cache-Control', 'public, max-age=60');
			await cache.put(cacheKey, stored);
		}
		return response;
	}
	return notFound(url);
}

export const GET = serve;
export const HEAD = serve;
export const ALL = ({ url }: APIContext) => notFound(url);
