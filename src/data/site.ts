// Единые контакты сайта. Домен НЕ дублируем — он живёт в astro.config.mjs (site)
// и доступен как Astro.site / import.meta.env.SITE.
//
// Почты на сайте НЕТ намеренно (решение Витала 04.09.2026): переписки по email не будет,
// все заявки падают в Telegram через /send. Единственный публичный канал связи — Telegram.
export const CONTACT_TELEGRAM_URL = 'https://t.me/mrlapin';
export const CONTACT_TELEGRAM_HANDLE = '@mrlapin';
