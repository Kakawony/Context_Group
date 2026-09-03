import type { APIContext } from 'astro';
import { getSecret } from 'astro:env/server';

// Серверный приём заявок форм → Telegram (on-demand роут воркера Cloudflare).
// Токен и chat_id ТОЛЬКО из runtime-секретов воркера
// (Cloudflare → Worker → Settings → Variables and Secrets): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// Читаем через astro:env/server.getSecret — официальный API Astro 6; адаптер Cloudflare
// подставляет env воркера (envGetSecret: stable), в dev берётся из .env/process.env.
// ВАЖНО: locals.runtime.env в Astro 6 удалён и бросает исключение — не использовать.
// Фолбэков в коде нет намеренно: репозиторий публичный, секреты в нём не живут.
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
	const { request } = context;
	const TOKEN = getSecret('TELEGRAM_BOT_TOKEN') || '';
	const CHAT_ID = getSecret('TELEGRAM_CHAT_ID') || '';

	let form: FormData | null = null;
	try {
		form = await request.formData();
	} catch {
		form = null;
	}
	const f = (k: string): string => {
		const v = form?.get(k);
		return typeof v === 'string' ? v.trim() : '';
	};

	const name = f('name');
	const contact = f('contact') || f('phone_or_tg') || f('phone');
	const message = f('message');
	const service = f('service');
	const prompt = f('prompt');
	const offer = f('offer');
	const honey = f('_gotcha'); // ловушка для ботов

	const accept = request.headers.get('accept') || '';
	const xrw = request.headers.get('x-requested-with') || '';
	const isAjax = accept.includes('application/json') || xrw !== '';

	const finish = (ok: boolean): Response => {
		if (isAjax) {
			return new Response(ok ? '{"ok":true}' : '{"ok":false}', {
				status: ok ? 200 : 400,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'X-Content-Type-Options': 'nosniff',
				},
			});
		}
		// _next принимаем только как относительный путь на нашем же домене
		// (/thanks, в будущем /en/thanks) — никаких внешних редиректов.
		let next = f('_next');
		if (!/^\/(?!\/)/.test(next)) next = '/thanks';
		const location = new URL(next, context.site ?? context.url).href;
		return new Response(null, { status: 303, headers: { Location: location } });
	};

	// honeypot заполнен ботом — делаем вид, что всё ок, но не шлём
	if (honey !== '') return finish(true);
	// нет ни имени, ни контакта — мусор
	if (name === '' && contact === '') return finish(false);
	// секреты не настроены — честно отвечаем ошибкой, чтобы это было видно в логах воркера
	if (!TOKEN || !CHAT_ID) {
		console.error('send.ts: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в окружении воркера');
		return finish(false);
	}

	const lines: string[] = ['🔔 Новая заявка с сайта'];
	if (service) lines.push('📄 Услуга: ' + service);
	if (prompt) lines.push('🧩 Промт: ' + prompt);
	if (offer) lines.push('💼 Вариант: ' + offer);
	if (name) lines.push('👤 Имя: ' + name);
	if (contact) lines.push('📞 Контакт: ' + contact);
	if (message) lines.push('✍️ Сообщение: ' + message);
	const ref = request.headers.get('referer') || '';
	if (ref) lines.push('🌐 Страница: ' + ref);

	try {
		await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				chat_id: CHAT_ID,
				text: lines.join('\n'),
				disable_web_page_preview: 'true',
			}),
		});
	} catch {
		// сеть могла подвести — посетителю всё равно показываем успех
	}

	return finish(true);
}
