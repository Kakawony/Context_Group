import { env } from 'cloudflare:workers';

// Хранилище раздела /dev — R2-бакет ai-lapin-dev (привязка DEV_FILES, см. wrangler.bindings.jsonc).
//
//   projects/<slug>.json            карточка: project.json пакета + enabled + uploadedAt
//   files/<slug>/<version>/<путь>   файлы сайта проекта (содержимое папки site/ пакета)
//
// Отдаётся только версия из карточки. Новая выгрузка пишет карточку последней —
// до этого клиент видит прежнюю версию целиком, после — новую целиком; удалённые
// в новой версии файлы лежат под старой версией и больше не отдаются.
// Выгружает скрипт хаба: Projects/context_group_hub/Parsers_and_Scripts/dev_upload.mjs.

export interface DevPage {
	path: string;
	group: string;
	title: string;
}

export interface DevProject {
	slug: string;
	title: string;
	client?: string;
	description?: string;
	version: string;
	base: string;
	entry: string;
	pages: DevPage[];
	files?: number;
	bytes?: number;
	notes?: string;
	enabled: boolean;
	uploadedAt?: string;
}

/** Минимум API R2 и Rate Limiting, который здесь используется (типы воркера не генерируем). */
export interface R2Range {
	offset?: number;
	length?: number;
	suffix?: number;
}
export interface R2ObjectLike {
	key: string;
	size: number;
	httpEtag: string;
	uploaded: Date;
	range?: R2Range;
	httpMetadata?: { contentType?: string };
	writeHttpMetadata(headers: Headers): void;
}
export interface R2ObjectBodyLike extends R2ObjectLike {
	body: ReadableStream;
	json<T>(): Promise<T>;
}
interface R2BucketLike {
	get(
		key: string,
		options?: { range?: Headers | R2Range; onlyIf?: Headers },
	): Promise<R2ObjectBodyLike | R2ObjectLike | null>;
	put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
	list(options: { prefix: string; cursor?: string }): Promise<{
		objects: { key: string }[];
		truncated: boolean;
		cursor?: string;
	}>;
}
interface DevEnv {
	DEV_FILES?: R2BucketLike;
	DEV_LOGIN_LIMIT?: { limit(o: { key: string }): Promise<{ success: boolean }> };
	ASSETS?: { fetch(req: Request | string): Promise<Response> };
}

export const devEnv = env as unknown as DevEnv;

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CACHE_MS = 5000;
// Ключ кэша приходит из адреса, поэтому размер ограничен: перебор несуществующих slug
// иначе наращивал бы память изолята. Переполнился — чистим целиком, потеря дешёвая.
const CACHE_MAX = 100;
const cache = new Map<string, { at: number; value: DevProject | null }>();

function remember(slug: string, value: DevProject | null): void {
	if (cache.size >= CACHE_MAX && !cache.has(slug)) cache.clear();
	cache.set(slug, { at: Date.now(), value });
}

function bucket(): R2BucketLike {
	if (!devEnv.DEV_FILES) throw new Error('dev/projects: привязка DEV_FILES не настроена');
	return devEnv.DEV_FILES;
}

export function hasBody(obj: R2ObjectBodyLike | R2ObjectLike): obj is R2ObjectBodyLike {
	return 'body' in obj && obj.body !== undefined && obj.body !== null;
}

/** Карточка проекта. Кэш в памяти воркера 5 секунд, чтобы не читать R2 на каждый файл страницы. */
export async function getProject(slug: string, fresh = false): Promise<DevProject | null> {
	if (!SLUG_RE.test(slug)) return null;
	const hit = cache.get(slug);
	if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.value;
	const obj = await bucket().get(`projects/${slug}.json`);
	let value: DevProject | null = null;
	if (obj && hasBody(obj)) {
		try {
			value = await obj.json<DevProject>();
		} catch {
			console.error(`dev/projects: битая карточка projects/${slug}.json`);
		}
	}
	remember(slug, value);
	return value;
}

export async function listProjects(): Promise<DevProject[]> {
	const slugs: string[] = [];
	let cursor: string | undefined;
	do {
		const page = await bucket().list({ prefix: 'projects/', cursor });
		for (const o of page.objects) {
			const m = /^projects\/([a-z0-9-]+)\.json$/.exec(o.key);
			if (m) slugs.push(m[1]);
		}
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	const all = await Promise.all(slugs.map((s) => getProject(s, true)));
	return all
		.filter((p): p is DevProject => p !== null)
		.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

export async function setEnabled(slug: string, enabled: boolean): Promise<boolean> {
	const project = await getProject(slug, true);
	if (!project) return false;
	project.enabled = enabled;
	await bucket().put(`projects/${slug}.json`, JSON.stringify(project, null, 2), {
		httpMetadata: { contentType: 'application/json; charset=utf-8' },
	});
	remember(slug, project);
	return true;
}

/** Файл текущей версии проекта: с поддержкой Range и условных запросов (If-None-Match). */
export function getFile(project: DevProject, relPath: string, headers?: Headers) {
	return bucket().get(`files/${project.slug}/${project.version}/${relPath}`, headers ? { range: headers, onlyIf: headers } : undefined);
}
