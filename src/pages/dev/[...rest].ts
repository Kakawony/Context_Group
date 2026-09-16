import type { APIContext } from 'astro';
import { notFound } from '../../lib/dev/notFound';

// Любой неизвестный адрес под /dev — тот же 404, что у выключенного проекта
// (и с X-Robots-Tag из middleware, которого нет у встроенного 404 Astro).
export const prerender = false;

export const ALL = ({ url }: APIContext) => notFound(url);
