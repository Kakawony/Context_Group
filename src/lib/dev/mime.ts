// Content-Type по расширению — запасной вариант, если у объекта в R2 не записан тип.
// Скрипт выгрузки ставит тип сам по той же таблице.
const TYPES: Record<string, string> = {
	html: 'text/html; charset=utf-8',
	css: 'text/css; charset=utf-8',
	js: 'text/javascript; charset=utf-8',
	mjs: 'text/javascript; charset=utf-8',
	json: 'application/json; charset=utf-8',
	webmanifest: 'application/manifest+json',
	txt: 'text/plain; charset=utf-8',
	xml: 'application/xml; charset=utf-8',
	svg: 'image/svg+xml',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
	ico: 'image/x-icon',
	woff: 'font/woff',
	woff2: 'font/woff2',
	ttf: 'font/ttf',
	otf: 'font/otf',
	pdf: 'application/pdf',
	mp4: 'video/mp4',
	webm: 'video/webm',
	mp3: 'audio/mpeg',
};

export function mimeType(path: string): string {
	const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
	return TYPES[ext] || 'application/octet-stream';
}
