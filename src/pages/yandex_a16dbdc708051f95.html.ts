// Файл подтверждения прав в Яндекс.Вебмастере для ai-lapin.com.
//
// Почему роутом, а не файлом в public/: статика Cloudflare Workers включает
// html_handling=auto-trailing-slash и редиректит /имя.html → /имя (307).
// Яндекс требует по своему адресу честный 200, поэтому файл отдаёт воркер
// (prerender=false — иначе он снова попадёт в статику и получит тот же редирект).
export const prerender = false;

const BODY = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: a16dbdc708051f95</body>
</html>`;

export function GET(): Response {
	return new Response(BODY, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}
