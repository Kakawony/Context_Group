import type { APIContext } from 'astro';
import { endSession, sameOrigin } from '../../lib/dev/auth';
import { notFound } from '../../lib/dev/notFound';

// Выход из раздела /dev: стираем cookie сессии и возвращаем на форму входа.
export const prerender = false;

export function POST({ cookies, request, url, redirect }: APIContext): Response {
	if (!sameOrigin(request, url)) return new Response('Forbidden', { status: 403 });
	endSession(cookies);
	return redirect('/dev', 303);
}

export const ALL = ({ url }: APIContext) => notFound(url);
