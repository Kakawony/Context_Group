import { devEnv } from './projects';

/**
 * Единый 404 раздела /dev: тело страницы 404 сайта, одинаковые заголовки. Им отвечают
 * выключенный проект, несуществующий проект, несуществующий файл и любой неизвестный адрес
 * под /dev — по ответу нельзя понять, что проект есть. Свой 404 Astro для роутов под /dev
 * не используется: он уходит мимо middleware и остаётся без X-Robots-Tag.
 */
export async function notFound(url: URL): Promise<Response> {
	let body = 'Not found';
	let type = 'text/plain; charset=utf-8';
	try {
		const page = await devEnv.ASSETS?.fetch(new Request(new URL('/404', url)));
		if (page && page.ok) {
			body = await page.text();
			type = 'text/html; charset=utf-8';
		}
	} catch {
		/* нет ASSETS (astro dev) — остаётся текстовый 404 */
	}
	return new Response(body, {
		status: 404,
		headers: { 'Content-Type': type, 'Cache-Control': 'no-store' },
	});
}
