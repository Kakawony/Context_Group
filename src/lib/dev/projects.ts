import { env } from 'cloudflare:workers';

// Хранилище раздела /dev — Workers KV (привязка DEV_FILES, см. wrangler.bindings.jsonc).
//
//   projects/<slug>.json            карточка: project.json пакета + enabled + uploadedAt
//   files/<slug>/<version>/<путь>   файлы сайта проекта (содержимое папки site/ пакета)
//
// Почему KV, а не R2 (решение Витала 16.09.2026): R2 включается платной подпиской с
// привязкой карты, KV на аккаунте уже работает и карты не требует. Плата за это:
// файл до 25 МБ (самый большой в пакете Estadel — 3,6 МБ), 1000 записей в сутки
// (одна выгрузка — 748), и Range приходится резать в воркере самим (см. [...path].ts).
// Тип файла лежит в метаданных ключа, размер и версия — там же.
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

/** Метаданные файла, которые пишет скрипт выгрузки. */
export interface DevFileMeta {
	contentType?: string;
	/** Хэш содержимого от скрипта выгрузки — из него делается ETag. */
	etag?: string;
	/** Размер исходного файла в байтах (значение в KV хранится в base64). */
	size?: number;
}

/** Минимум API KV и Rate Limiting, который здесь используется (типы воркера не генерируем). */
interface KVNamespaceLike {
	get(key: string, options: { type: 'json' }): Promise<unknown | null>;
	getWithMetadata(
		key: string,
		options: { type: 'text' },
	): Promise<{ value: string | null; metadata: DevFileMeta | null }>;
	put(key: string, value: string, options?: { metadata?: DevFileMeta }): Promise<void>;
	list(options: { prefix: string; cursor?: string }): Promise<{
		keys: { name: string }[];
		list_complete: boolean;
		cursor?: string;
	}>;
}
interface DevEnv {
	DEV_FILES?: KVNamespaceLike;
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

function store(): KVNamespaceLike {
	if (!devEnv.DEV_FILES) throw new Error('dev/projects: привязка DEV_FILES не настроена');
	return devEnv.DEV_FILES;
}

/** Карточка проекта. Кэш в памяти воркера 5 секунд, чтобы не читать KV на каждый файл страницы. */
export async function getProject(slug: string, fresh = false): Promise<DevProject | null> {
	if (!SLUG_RE.test(slug)) return null;
	const hit = cache.get(slug);
	if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.value;
	let value: DevProject | null = null;
	try {
		value = ((await store().get(`projects/${slug}.json`, { type: 'json' })) as DevProject) ?? null;
	} catch {
		console.error(`dev/projects: битая карточка projects/${slug}.json`);
	}
	remember(slug, value);
	return value;
}

export async function listProjects(): Promise<DevProject[]> {
	const slugs: string[] = [];
	let cursor: string | undefined;
	do {
		const page = await store().list({ prefix: 'projects/', cursor });
		for (const k of page.keys) {
			const m = /^projects\/([a-z0-9-]+)\.json$/.exec(k.name);
			if (m) slugs.push(m[1]);
		}
		cursor = page.list_complete ? undefined : page.cursor;
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
	await store().put(`projects/${slug}.json`, JSON.stringify(project, null, 2));
	remember(slug, project);
	return true;
}

/**
 * Файл текущей версии проекта вместе с метаданными (тип, хэш, размер). Отсутствует — value === null.
 * Значение хранится в base64 СТРОКОЙ: пакетная запись KV портит двоичные данные —
 * PDF и шрифты возвращались покорёженными, с маркерами замены UTF-8 (проверено 16.09.2026).
 * Раскодировать — devFileBytes().
 */
export function getFile(project: DevProject, relPath: string) {
	return store().getWithMetadata(`files/${project.slug}/${project.version}/${relPath}`, { type: 'text' });
}

/** base64 из KV → байты файла. */
export function devFileBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
