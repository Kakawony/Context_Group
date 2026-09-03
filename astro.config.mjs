// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import cloudflare from '@astrojs/cloudflare';

// ЕДИНСТВЕННОЕ место, где прописан домен сайта. Всё остальное (canonical, og:url,
// sitemap, robots.txt, редирект форм, privacy) берёт его из Astro.site / import.meta.env.SITE.
// Смена домена = правка одной строки.
const SITE_URL = 'https://lapinvital.com';

// Cloudflare-адаптер нужен только для прод-сборки (astro build / astro preview).
// В dev админка Keystatic должна работать в Node (workerd не даёт node:fs/path),
// поэтому в dev адаптер не подключаем. astro.config читается ДО того, как Vite
// выставит NODE_ENV, поэтому дополнительно смотрим на команду в argv.
const isProdBuild =
	process.env.NODE_ENV === 'production' ||
	process.argv.includes('build') ||
	process.argv.includes('preview');

// https://astro.build/config
export default defineConfig({
	site: SITE_URL,
	// Публичные страницы остаются статикой (prerender по умолчанию),
	// админка Keystatic (/keystatic, /api/keystatic) рендерится on-demand через адаптер.
	...(isProdBuild ? { adapter: cloudflare() } : {}),
	integrations: [
		sitemap({
			// исключаем служебные и noindex-страницы из карты
			filter: (page) =>
				!page.includes('/thanks') &&
				!page.includes('/404') &&
				!page.includes('/keystatic'),
		}),
		react(),
		keystatic(),
	],
});
