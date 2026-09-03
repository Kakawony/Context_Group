import type { APIContext } from 'astro';

// robots.txt собирается на билде от домена из astro.config.mjs (site),
// чтобы при смене домена не править файл руками.
export const prerender = true;

export function GET({ site }: APIContext): Response {
	const base = site ?? new URL(import.meta.env.SITE);
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /keystatic',
		'Disallow: /api/',
		'Disallow: /send',
		'Disallow: /thanks',
		'',
		`Sitemap: ${new URL('/sitemap-index.xml', base).href}`,
		'',
	].join('\n');
	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
