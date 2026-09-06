import { defineMiddleware } from 'astro:middleware';
import { getSecret } from 'astro:env/server';

// Защита админки паролем (HTTP Basic).
//
// Зачем: /keystatic и /api/keystatic отдаются воркером публично — в robots.txt они
// закрыты от индексации, но не от людей. Cloudflare Access не используем: он требует
// отдельной активации Zero Trust, а логин и пароль в секретах воркера решают ту же
// задачу и не зависят от сторонних панелей.
//
// Логин и пароль — в секретах воркера ADMIN_USER / ADMIN_PASS (в dev берутся из .env).
// Публичные страницы пререндерены и до middleware вообще не доходят, но путь всё равно
// проверяется явно, чтобы случайно не закрыть сайт целиком.

const PROTECTED = /^\/(keystatic|api\/keystatic)(\/|$)/;

const unauthorized = (message: string): Response =>
	new Response(message, {
		status: 401,
		headers: {
			'WWW-Authenticate': 'Basic realm="Admin", charset="UTF-8"',
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});

/** Сравнение без утечки времени: длина сверяется отдельно, дальше все байты. */
function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export const onRequest = defineMiddleware(async (context, next) => {
	if (!PROTECTED.test(context.url.pathname)) return next();

	const user = getSecret('ADMIN_USER') || '';
	const pass = getSecret('ADMIN_PASS') || '';
	// Секреты не заданы — закрываем доступ, а не открываем настежь.
	if (!user || !pass) {
		console.error('middleware: ADMIN_USER / ADMIN_PASS не заданы — админка закрыта');
		return unauthorized('Админка не настроена');
	}

	const header = context.request.headers.get('authorization') || '';
	if (!header.startsWith('Basic ')) return unauthorized('Требуется авторизация');

	let decoded = '';
	try {
		decoded = atob(header.slice(6));
	} catch {
		return unauthorized('Некорректный заголовок авторизации');
	}

	const sep = decoded.indexOf(':');
	const gotUser = sep === -1 ? decoded : decoded.slice(0, sep);
	const gotPass = sep === -1 ? '' : decoded.slice(sep + 1);

	if (!safeEqual(gotUser, user) || !safeEqual(gotPass, pass)) {
		return unauthorized('Неверный логин или пароль');
	}

	return next();
});
