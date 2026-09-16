import type { APIContext } from 'astro';
import { hasSession, sameOrigin } from '../../lib/dev/auth';
import { SLUG_RE, setEnabled } from '../../lib/dev/projects';
import { notFound } from '../../lib/dev/notFound';

// Переключатель «показывать / скрыть» проекта. Обычная POST-форма со страницы /dev/all,
// работает без JS. Действует без передеплоя: карточка проекта в R2 перезаписывается.
export const prerender = false;

export async function POST({ cookies, request, url, redirect }: APIContext): Promise<Response> {
	if (!sameOrigin(request, url)) return new Response('Forbidden', { status: 403 });
	if (!(await hasSession(cookies))) return redirect('/dev', 303);

	let form: FormData | null = null;
	try {
		form = await request.formData();
	} catch {
		form = null;
	}
	const slug = String(form?.get('slug') || '');
	const enabled = form?.get('enabled') === '1';
	if (!SLUG_RE.test(slug) || !(await setEnabled(slug, enabled))) {
		return new Response('Проект не найден', { status: 404 });
	}
	return redirect(`/dev/all#${slug}`, 303);
}

export const ALL = ({ url }: APIContext) => notFound(url);
