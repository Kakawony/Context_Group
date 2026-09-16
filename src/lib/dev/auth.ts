import type { AstroCookies } from 'astro';
import { getSecret } from 'astro:env/server';

// Вход в раздел /dev (служебный, только для Витала).
//
// Логин и пароль — те же секреты воркера, что у админки: ADMIN_USER / ADMIN_PASS.
// Сессия — подписанная cookie без хранилища: "v1.<истекает, unix-секунды>.<подпись>".
// Ключ подписи = HMAC(KEYSTATIC_SECRET, "dev-session:" + ADMIN_PASS):
//   - новых секретов не нужно;
//   - смена пароля сразу гасит все выданные сессии;
//   - без сильного KEYSTATIC_SECRET по перехваченной cookie нельзя подбирать пароль офлайн.
// Любого из трёх секретов нет — вход закрыт, а не открыт.

export const SESSION_COOKIE = 'dev_session';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 дней

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
	let s = '';
	for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(key: BufferSource, message: string): Promise<ArrayBuffer> {
	const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return crypto.subtle.sign('HMAC', k, enc.encode(message));
}

/** Сравнение без утечки времени: длина сверяется отдельно, дальше все символы. */
export function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

interface Secrets {
	user: string;
	pass: string;
	master: string;
}

function readSecrets(): Secrets | null {
	const user = getSecret('ADMIN_USER') || '';
	const pass = getSecret('ADMIN_PASS') || '';
	const master = getSecret('KEYSTATIC_SECRET') || '';
	if (!user || !pass || !master) {
		console.error('dev/auth: ADMIN_USER / ADMIN_PASS / KEYSTATIC_SECRET не заданы — вход в /dev закрыт');
		return null;
	}
	return { user, pass, master };
}

async function sign(payload: string, s: Secrets): Promise<string> {
	const key = await hmac(enc.encode(s.master), 'dev-session:' + s.pass);
	return b64url(await hmac(key, payload));
}

/** Проверка логина и пароля. null — вход не настроен (секретов нет). */
export function checkCredentials(user: string, pass: string): boolean | null {
	const s = readSecrets();
	if (!s) return null;
	// Обе проверки выполняются всегда, чтобы время ответа не выдавало верный логин.
	const okUser = safeEqual(user, s.user);
	const okPass = safeEqual(pass, s.pass);
	return okUser && okPass;
}

export async function startSession(cookies: AstroCookies): Promise<void> {
	const s = readSecrets();
	if (!s) return;
	const payload = `v1.${Math.floor(Date.now() / 1000) + SESSION_TTL}`;
	cookies.set(SESSION_COOKIE, `${payload}.${await sign(payload, s)}`, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/dev',
		maxAge: SESSION_TTL,
	});
}

export function endSession(cookies: AstroCookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/dev', httpOnly: true, secure: true, sameSite: 'lax' });
}

export async function hasSession(cookies: AstroCookies): Promise<boolean> {
	const raw = cookies.get(SESSION_COOKIE)?.value || '';
	const m = /^(v1\.(\d{1,12}))\.([A-Za-z0-9_-]{43})$/.exec(raw);
	if (!m) return false;
	if (Number(m[2]) < Date.now() / 1000) return false;
	const s = readSecrets();
	if (!s) return false;
	return safeEqual(m[3], await sign(m[1], s));
}

/**
 * Защита POST-запросов с сессией от подделки с чужих сайтов: браузер всегда шлёт Origin
 * у POST-формы, он обязан совпасть с адресом сайта. SameSite=Lax — второй рубеж.
 */
export function sameOrigin(request: Request, url: URL): boolean {
	return request.headers.get('origin') === url.origin;
}
