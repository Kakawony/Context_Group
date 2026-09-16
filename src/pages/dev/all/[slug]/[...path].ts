import type { APIContext } from 'astro';
import { getFile, getProject, hasBody, type R2ObjectLike } from '../../../../lib/dev/projects';
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
 * Разбор заголовка Range. R2 сам режет и «чинит» любой диапазон, поэтому форму запроса
 * разбираем отдельно: кривой заголовок по стандарту игнорируется (обычные 200),
 * диапазон за концом файла — 416, и только корректный даёт 206.
 */
function parseRange(header: string | null): { start?: number; suffix?: number } | null {
	const m = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
	if (!m) return null;
	const [, from, to] = m;
	if (from === '') return to === '' ? null : { suffix: Number(to) };
	if (to !== '' && Number(to) < Number(from)) return null;
	return { start: Number(from) };
}

function contentRange(obj: R2ObjectLike): string | null {
	const r = obj.range;
	if (!r) return null;
	let start: number;
	let length: number;
	if (r.suffix !== undefined) {
		length = Math.min(r.suffix, obj.size);
		start = obj.size - length;
	} else {
		start = r.offset ?? 0;
		length = r.length ?? obj.size - start;
	}
	return `bytes ${start}-${start + length - 1}/${obj.size}`;
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

	// Страницы без расширения сначала ищем как <путь>.html — так на страницу один запрос к R2.
	const lastSegment = segments[segments.length - 1];
	const candidates = rel === '' ? ['index.html'] : lastSegment.includes('.') ? [rel, `${rel}.html`] : [`${rel}.html`, rel];

	for (const key of candidates) {
		let obj;
		try {
			obj = await getFile(project, key, request.headers);
		} catch (e) {
			console.error('dev/serve:', e);
			// 416 только если клиент и правда просил диапазон; иначе это сбой хранилища
			// (нет привязки DEV_FILES, ошибка R2) — его нельзя маскировать под Range.
			if (!request.headers.has('range')) throw e;
			return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */*' } });
		}
		if (!obj) continue;

		const headers = new Headers();
		obj.writeHttpMetadata(headers);
		if (!headers.get('Content-Type')) headers.set('Content-Type', mimeType(key));
		headers.set('ETag', obj.httpEtag);
		headers.set('Accept-Ranges', 'bytes');
		headers.set('X-Content-Type-Options', 'nosniff');
		// Короткий кэш: после выключения проекта файлы не должны долго жить в браузере клиента.
		headers.set('Cache-Control', key.endsWith('.html') ? 'no-cache' : 'private, max-age=300');

		if (!hasBody(obj)) return new Response(null, { status: 304, headers });

		const asked = parseRange(request.headers.get('range'));
		if (asked && ((asked.start !== undefined && asked.start >= obj.size) || asked.suffix === 0)) {
			return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${obj.size}` } });
		}
		const range = asked ? contentRange(obj) : null;
		if (range) {
			headers.set('Content-Range', range);
			const [, from, to] = /bytes (\d+)-(\d+)/.exec(range) || [];
			headers.set('Content-Length', String(Number(to) - Number(from) + 1));
		} else {
			headers.set('Content-Length', String(obj.size));
		}
		const body = request.method === 'HEAD' ? null : obj.body;
		return new Response(body, { status: range ? 206 : 200, headers });
	}
	return notFound(url);
}

export const GET = serve;
export const HEAD = serve;
export const ALL = ({ url }: APIContext) => notFound(url);
