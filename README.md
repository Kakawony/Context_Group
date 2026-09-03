# Сайт Виталия Лапина

Персональный сайт специалиста по внедрению AI в бизнес, SEO и performance-маркетингу.

- **Стек:** Astro 6, React (для админки), Keystatic (git-based CMS), Cloudflare Workers.
- **Контент:** `src/content/pages/**` (JSON + `.mdoc`), статьи `src/pages/blog/*.md`, промпты `src/pages/prompts/*.md`.
- **Админка:** `/keystatic` (в dev — локальный storage, в проде — GitHub OAuth).
- **Формы:** `src/pages/send.ts` → Telegram; секреты только в переменных воркера.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # прод-сборка (адаптер Cloudflare)
npm run preview   # предпросмотр прод-сборки в workerd
```

Домен задаётся один раз в `astro.config.mjs` (`SITE_URL`).
