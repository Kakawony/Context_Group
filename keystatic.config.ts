import { config, fields, singleton, collection } from '@keystatic/core';

// Режим хранилища Keystatic.
//  • Локальный (по умолчанию): правки админки пишутся в src/content — для разработки.
//  • GitHub-режим (веб-админка на боевом .com): включается переменной сборки
//    PUBLIC_KEYSTATIC_MODE=github в Cloudflare Pages. Тогда правки в /keystatic идут
//    коммитами в репозиторий Kakawony/Context_Group.
//    Дополнительно нужен GitHub App и его секреты в env Cloudflare:
//    KEYSTATIC_GITHUB_CLIENT_ID, KEYSTATIC_GITHUB_CLIENT_SECRET, KEYSTATIC_SECRET.
// Без переменной — локальный режим (текущее поведение, сборка не меняется).
const keystaticMode = import.meta.env?.PUBLIC_KEYSTATIC_MODE;

export default config({
	storage:
		keystaticMode === 'github'
			? { kind: 'github', repo: 'Kakawony/Context_Group' }
			: { kind: 'local' },
	ui: {
		brand: { name: 'Context Group' },
	},
	singletons: {
		glavnaya: singleton({
			label: 'Страница: Главная',
			path: 'src/content/pages/glavnaya/index',
			previewUrl: '/',
			format: { data: 'json' },
			schema: {
				// --- Hero ---
				hero: fields.object(
					{
						titleLead: fields.text({ label: 'Заголовок H1 — начало' }),
						titleAccent: fields.text({ label: 'Заголовок H1 — выделенная (градиент) часть' }),
						titleTail: fields.text({ label: 'Заголовок H1 — окончание (со 2-й строки)' }),
						lead: fields.text({ label: 'Вводный абзац (лид)', multiline: true }),
						exp1: fields.text({ label: 'Опыт — число 1 (градиент), напр. «13 лет»' }),
						expText1: fields.text({ label: 'Опыт — текст 1, напр. « в маркетинге — »' }),
						exp2: fields.text({ label: 'Опыт — число 2 (градиент), напр. «1 год»' }),
						expText2: fields.text({ label: 'Опыт — текст 2, напр. « в разработке с AI»' }),
						tags: fields.array(
							fields.object({
								text: fields.text({ label: 'Текст тега (# ...)' }),
								dataTag: fields.text({ label: 'data-tag (тех. идентификатор фильтра)' }),
								href: fields.text({ label: 'Ссылка (если тег ведёт на раздел; пусто = не ссылка)' }),
							}),
							{ label: 'Хэштеги направлений', itemLabel: (p) => p.fields.text.value }
						),
						formName: fields.text({ label: 'Плейсхолдер поля «Имя»' }),
						formContact: fields.text({ label: 'Плейсхолдер поля «Контакт»' }),
						formButton: fields.text({ label: 'Текст кнопки формы в hero' }),
					},
					{ label: 'Hero (первый экран)' }
				),

				// --- Услуги (компонент ServicesSection) ---
				services: fields.object(
					{
						titleLead: fields.text({ label: 'Заголовок — начало' }),
						titleAccent: fields.text({ label: 'Заголовок — выделенная часть' }),
						items: fields.array(
							fields.object({
								title: fields.text({ label: 'Название услуги' }),
								href: fields.text({ label: 'Ссылка на страницу услуги' }),
								desc: fields.text({ label: 'Описание', multiline: true }),
								badge: fields.text({ label: 'Бейдж (напр. «С этого начать»); пусто = нет' }),
							}),
							{ label: 'Карточки услуг (6 шт)', itemLabel: (p) => p.fields.title.value }
						),
					},
					{ label: 'Блок «Услуги по AI-интеграции»' }
				),

				// --- Баннер обучения ---
				edu: fields.object(
					{
						tag: fields.text({ label: 'Плашка-тег (напр. «Новое · Обучение»)' }),
						titleLead: fields.text({ label: 'Заголовок — начало' }),
						titleAccent: fields.text({ label: 'Заголовок — выделенная часть' }),
						text: fields.text({ label: 'Текст баннера', multiline: true }),
						btnText: fields.text({ label: 'Текст кнопки' }),
						btnHref: fields.text({ label: 'Ссылка кнопки' }),
						linkText: fields.text({ label: 'Текст доп. ссылки' }),
						linkHref: fields.text({ label: 'Ссылка доп. ссылки' }),
					},
					{ label: 'Баннер «Обучение маркетингу с AI»' }
				),

				// --- Кейсы ---
				cases: fields.object(
					{
						titleLead: fields.text({ label: 'Заголовок секции — начало' }),
						titleAccent: fields.text({ label: 'Заголовок секции — выделенная часть' }),
						sub: fields.text({ label: 'Подзаголовок секции', multiline: true }),
						items: fields.array(
							fields.object({
								meta: fields.text({ label: 'Мета (напр. «Реконструкция сайта · MODX»)' }),
								date: fields.text({ label: 'Дата' }),
								title: fields.text({ label: 'Заголовок кейса' }),
								href: fields.text({ label: 'Ссылка на кейс' }),
								desc: fields.text({ label: 'Описание', multiline: true }),
								vsWin: fields.text({ label: 'Результат «наш» (напр. «45 000 ₽ · 4 дня»)' }),
								vsLose: fields.text({ label: 'Результат «агентство» (зачёркнутый)' }),
								linkText: fields.text({ label: 'Текст ссылки «Читать кейс»' }),
							}),
							{ label: 'Карточки кейсов', itemLabel: (p) => p.fields.title.value }
						),
					},
					{ label: 'Блок «Кейсы»' }
				),

				// --- Отрасли ---
				industries: fields.object(
					{
						titleLead: fields.text({ label: 'Заголовок секции — начало' }),
						titleAccent: fields.text({ label: 'Заголовок секции — выделенная часть' }),
						sub: fields.text({ label: 'Подзаголовок секции', multiline: true }),
						items: fields.array(
							fields.object({
								title: fields.text({ label: 'Название отрасли' }),
								href: fields.text({ label: 'Ссылка' }),
								desc: fields.text({ label: 'Описание', multiline: true }),
								linkText: fields.text({ label: 'Текст ссылки' }),
							}),
							{ label: 'Карточки отраслей', itemLabel: (p) => p.fields.title.value }
						),
					},
					{ label: 'Блок «AI-инструменты по отраслям»' }
				),

				// --- Большой SEO-текст (rich-блоки + 2 таблицы) ---
				seoBlock1: fields.document({
					label: 'SEO-текст: блок 1 (заголовок + вступление)',
					formatting: true,
					links: true,
				}),
				seoTables: fields.object(
					{
						teamH1: fields.text({ label: 'Таблица команды — заголовок колонки 1' }),
						teamH2: fields.text({ label: 'Таблица команды — заголовок колонки 2' }),
						teamH3: fields.text({ label: 'Таблица команды — заголовок колонки 3' }),
						team: fields.array(
							fields.object({
								who: fields.text({ label: 'Кто' }),
								role: fields.text({ label: 'Роль' }),
								resp: fields.text({ label: 'За что отвечает' }),
								lead: fields.checkbox({ label: 'Выделить как ведущего (архитектор)', defaultValue: false }),
							}),
							{ label: 'Строки таблицы команды', itemLabel: (p) => p.fields.who.value }
						),
						svcH1: fields.text({ label: 'Таблица услуг — заголовок колонки 1' }),
						svcH2: fields.text({ label: 'Таблица услуг — заголовок колонки 2' }),
						svcH3: fields.text({ label: 'Таблица услуг — заголовок колонки 3' }),
						svc: fields.array(
							fields.object({
								service: fields.text({ label: 'Услуга' }),
								note: fields.text({ label: 'Примечание под услугой' }),
								oldTime: fields.text({ label: 'Агентство — время' }),
								oldPrice: fields.text({ label: 'Агентство — цена (зачёркнутая)' }),
								newTime: fields.text({ label: 'AI-команда — время' }),
								newPrice: fields.text({ label: 'AI-команда — цена' }),
							}),
							{ label: 'Строки таблицы сравнения услуг', itemLabel: (p) => p.fields.service.value }
						),
					},
					{ label: 'SEO-текст: таблицы (команда + сравнение услуг)' }
				),
				seoBlock2: fields.document({
					label: 'SEO-текст: блок 2 (подзаголовки между таблицами)',
					formatting: true,
					links: true,
				}),
				seoBlock3: fields.document({
					label: 'SEO-текст: блок 3 (финальный абзац)',
					formatting: true,
					links: true,
				}),

				// --- FAQ ---
				faq: fields.object(
					{
						heading: fields.text({ label: 'Заголовок блока FAQ' }),
						items: fields.array(
							fields.object({
								q: fields.text({ label: 'Вопрос' }),
								a: fields.text({ label: 'Ответ', multiline: true }),
							}),
							{ label: 'Вопросы-ответы', itemLabel: (p) => p.fields.q.value }
						),
					},
					{ label: 'Блок FAQ' }
				),

				// --- Форма контакта ---
				contact: fields.object(
					{
						titleLead: fields.text({ label: 'Заголовок — начало' }),
						titleAccent: fields.text({ label: 'Заголовок — выделенная часть' }),
						sub: fields.text({ label: 'Подзаголовок', multiline: true }),
						nameLabel: fields.text({ label: 'Подпись поля «Имя»' }),
						namePlaceholder: fields.text({ label: 'Плейсхолдер поля «Имя»' }),
						contactLabel: fields.text({ label: 'Подпись поля «Контакт»' }),
						contactPlaceholder: fields.text({ label: 'Плейсхолдер поля «Контакт»' }),
						msgLabel: fields.text({ label: 'Подпись поля «Сообщение»' }),
						msgPlaceholder: fields.text({ label: 'Плейсхолдер поля «Сообщение»' }),
						button: fields.text({ label: 'Текст кнопки отправки' }),
					},
					{ label: 'Форма обратной связи' }
				),
			},
		}),
		obuchenie: singleton({
			label: 'Страница: Обучение',
			path: 'src/content/pages/obuchenie/index',
			previewUrl: '/obuchenie-marketingu-s-ai',
			format: { data: 'json' },
			schema: {
				// --- Hero ---
				heroTag: fields.text({ label: 'Бейдж над заголовком' }),
				heroTitleLead: fields.text({ label: 'Заголовок — обычная часть' }),
				heroTitleAccent: fields.text({ label: 'Заголовок — выделенная (градиент) часть' }),
				heroLead: fields.text({ label: 'Вводный абзац (лид)', multiline: true }),
				priceValue: fields.text({ label: 'Цена (например, 40 000 ₽)' }),
				priceNote: fields.text({ label: 'Примечание к цене' }),
				heroButton: fields.text({ label: 'Текст кнопки в hero' }),

				// --- Программа ---
				programTitleLead: fields.text({ label: 'Заголовок программы — обычная часть' }),
				programTitleAccent: fields.text({ label: 'Заголовок программы — выделенная часть' }),
				programSub: fields.text({ label: 'Подзаголовок программы', multiline: true }),
				lessons: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02, …)' }),
						title: fields.text({ label: 'Название урока' }),
						desc: fields.text({ label: 'Описание', multiline: true }),
						result: fields.text({ label: 'Итог урока', multiline: true }),
						free: fields.checkbox({ label: 'Бесплатный / доступен', defaultValue: false }),
						href: fields.text({ label: 'Ссылка на урок (только для доступных)' }),
					}),
					{
						label: 'Уроки',
						itemLabel: (p) => `${p.fields.num.value} — ${p.fields.title.value}`,
					}
				),

				// --- Кто ведёт обучение ---
				aboutHeading: fields.text({ label: 'Заголовок блока «Кто ведёт»' }),
				aboutSubheading: fields.text({ label: 'Подзаголовок блока «Кто ведёт»', multiline: true }),

				// --- Форма заявки (нижняя) ---
				offerTitleLead: fields.text({ label: 'Заголовок формы — обычная часть' }),
				offerTitleAccent: fields.text({ label: 'Заголовок формы — выделенная часть' }),
				offerText: fields.text({ label: 'Текст формы', multiline: true }),
				offerPriceValue: fields.text({ label: 'Цена в форме' }),
				offerPriceNote: fields.text({ label: 'Примечание к цене в форме' }),
				offerButton: fields.text({ label: 'Текст кнопки формы' }),

				// --- Карьерный блок ---
				careerTitleLead: fields.text({ label: 'Заголовок «Мой путь» — обычная часть' }),
				careerTitleAccent: fields.text({ label: 'Заголовок «Мой путь» — выделенная часть' }),
				careerSub: fields.text({ label: 'Подзаголовок карьерного блока', multiline: true }),
			},
		}),
		sozdanie: singleton({
			label: 'Услуга: Создание сайта с AI',
			path: 'src/content/pages/sozdanie/index',
			previewUrl: '/sozdanie-sajta-s-ai',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				formSub: fields.text({ label: 'Подпись под формой', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				pricing: fields.array(
					fields.object({
						title: fields.text({ label: 'Название тарифа' }),
						sub: fields.text({ label: 'Подзаголовок тарифа', multiline: true }),
						currency: fields.text({ label: 'От/до' }),
						amount: fields.text({ label: 'Сумма' }),
						features: fields.array(fields.text({ label: 'Пункт тарифа (можно с HTML)' }), { label: 'Пункты тарифа', itemLabel: (p) => p.value }),
						btn: fields.text({ label: 'Текст кнопки' }),
						popular: fields.checkbox({ label: 'Популярный тариф', defaultValue: false }),
					}),
					{ label: 'Тарифы', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		rekonstrukciya: singleton({
			label: 'Услуга: Реконструкция сайта с AI',
			path: 'src/content/pages/rekonstrukciya/index',
			previewUrl: '/rekonstrukciya-sajta-s-ai',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				pricing: fields.array(
					fields.object({
						title: fields.text({ label: 'Название тарифа' }),
						sub: fields.text({ label: 'Подзаголовок тарифа', multiline: true }),
						currency: fields.text({ label: 'От/до' }),
						amount: fields.text({ label: 'Сумма' }),
						features: fields.array(fields.text({ label: 'Пункт тарифа (можно с HTML)' }), { label: 'Пункты тарифа', itemLabel: (p) => p.value }),
						btn: fields.text({ label: 'Текст кнопки' }),
						popular: fields.checkbox({ label: 'Популярный тариф', defaultValue: false }),
					}),
					{ label: 'Тарифы', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		'seo-konvejer': singleton({
			label: 'Услуга: SEO-конвейер с AI',
			path: 'src/content/pages/seo-konvejer/index',
			previewUrl: '/seo-konvejer-s-ai',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				pricing: fields.array(
					fields.object({
						title: fields.text({ label: 'Название тарифа' }),
						sub: fields.text({ label: 'Подзаголовок тарифа', multiline: true }),
						currency: fields.text({ label: 'От/до' }),
						amount: fields.text({ label: 'Сумма' }),
						features: fields.array(fields.text({ label: 'Пункт тарифа (можно с HTML)' }), { label: 'Пункты тарифа', itemLabel: (p) => p.value }),
						btn: fields.text({ label: 'Текст кнопки' }),
						popular: fields.checkbox({ label: 'Популярный тариф', defaultValue: false }),
					}),
					{ label: 'Тарифы', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		'performance-marketing': singleton({
			label: 'Услуга: Performance-маркетинг',
			path: 'src/content/pages/performance-marketing/index',
			previewUrl: '/performance-marketing',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroTitleTail: fields.text({ label: 'Заголовок H1 — хвост (после градиента)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				pricing: fields.array(
					fields.object({
						title: fields.text({ label: 'Название тарифа' }),
						sub: fields.text({ label: 'Подзаголовок тарифа', multiline: true }),
						currency: fields.text({ label: 'От/до' }),
						amount: fields.text({ label: 'Сумма' }),
						features: fields.array(fields.text({ label: 'Пункт тарифа (можно с HTML)' }), { label: 'Пункты тарифа', itemLabel: (p) => p.value }),
						btn: fields.text({ label: 'Текст кнопки' }),
						popular: fields.checkbox({ label: 'Популярный тариф', defaultValue: false }),
					}),
					{ label: 'Тарифы', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		'parsing-dannyh': singleton({
			label: 'Услуга: Парсинг данных с AI',
			path: 'src/content/pages/parsing-dannyh/index',
			previewUrl: '/parsing-dannyh-s-ai',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				pricing: fields.array(
					fields.object({
						title: fields.text({ label: 'Название тарифа' }),
						sub: fields.text({ label: 'Подзаголовок тарифа', multiline: true }),
						currency: fields.text({ label: 'От/до' }),
						amount: fields.text({ label: 'Сумма' }),
						features: fields.array(fields.text({ label: 'Пункт тарифа (можно с HTML)' }), { label: 'Пункты тарифа', itemLabel: (p) => p.value }),
						btn: fields.text({ label: 'Текст кнопки' }),
						popular: fields.checkbox({ label: 'Популярный тариф', defaultValue: false }),
					}),
					{ label: 'Тарифы', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		'audit-vnedreniya-ai': singleton({
			label: 'Аудит: Внедрение AI',
			path: 'src/content/pages/audit-vnedreniya-ai/index',
			previewUrl: '/audit-vnedreniya-ai',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
		'audit-nedvizhimost': singleton({
			label: 'Аудит: Недвижимость',
			path: 'src/content/pages/audit-nedvizhimost/index',
			previewUrl: '/audit-nedvizhimost',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				showDirections: fields.checkbox({ label: 'Показывать другие направления', defaultValue: true }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				casesSub: fields.text({ label: 'Подзаголовок кейсов', multiline: true }),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
				ctaTitleLead: fields.text({ label: 'Заголовок CTA — начало' }),
				ctaTitleAccent: fields.text({ label: 'Заголовок CTA — выделенное (градиент)' }),
				ctaSub: fields.text({ label: 'Текст CTA', multiline: true }),
				ctaBtn: fields.text({ label: 'Текст кнопки CTA' }),
			},
		}),
		'audit-stomatologiya': singleton({
			label: 'Аудит: Стоматология',
			path: 'src/content/pages/audit-stomatologiya/index',
			previewUrl: '/audit-stomatologiya',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title (вкладка/поиск)' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				slug: fields.text({ label: 'URL страницы (slug)' }),
				showDirections: fields.checkbox({ label: 'Показывать другие направления', defaultValue: true }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				heroFeatures: fields.array(fields.text({ label: 'Пункт' }), { label: 'Пункты-буллеты hero', itemLabel: (p) => p.value }),
				processTitleLead: fields.text({ label: 'Заголовок процесса — начало' }),
				processTitleAccent: fields.text({ label: 'Заголовок процесса — выделенное (градиент)' }),
				processSub: fields.text({ label: 'Подзаголовок процесса', multiline: true }),
				processSteps: fields.array(
					fields.object({
						num: fields.text({ label: 'Номер (01, 02…)' }),
						title: fields.text({ label: 'Заголовок шага' }),
						text: fields.text({ label: 'Текст шага', multiline: true }),
					}),
					{ label: 'Шаги процесса', itemLabel: (p) => p.fields.title.value }
				),
				processSeo: fields.text({ label: 'SEO-текст под процессом', multiline: true }),
				casesSub: fields.text({ label: 'Подзаголовок кейсов', multiline: true }),
				seoTitle: fields.text({ label: 'SEO-заголовок секции' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
				ctaTitleLead: fields.text({ label: 'Заголовок CTA — начало' }),
				ctaTitleAccent: fields.text({ label: 'Заголовок CTA — выделенное (градиент)' }),
				ctaSub: fields.text({ label: 'Текст CTA', multiline: true }),
				ctaBtn: fields.text({ label: 'Текст кнопки CTA' }),
			},
		}),
		'ai-solutions': singleton({
			label: 'Страница: AI-решения',
			path: 'src/content/pages/ai-solutions/index',
			previewUrl: '/ai-solutions',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				industries: fields.array(
					fields.object({
						iconClass: fields.select({
							label: 'Цвет иконки',
							options: [
								{ label: 'Фиолетовый', value: 'purple' },
								{ label: 'Голубой', value: 'cyan' },
							],
							defaultValue: 'purple',
						}),
						icon: fields.select({
							label: 'Иконка',
							options: [
								{ label: 'Здание / недвижимость', value: 'building' },
								{ label: 'Браузер / сайт', value: 'browser' },
								{ label: 'Задачи / чек-лист', value: 'tasks' },
								{ label: 'Код', value: 'code' },
								{ label: 'Ссылка / интеграция', value: 'link' },
								{ label: 'Поиск / SEO', value: 'search' },
								{ label: 'Аналитика / график', value: 'chart' },
								{ label: 'База данных / парсинг', value: 'database' },
							],
							defaultValue: 'building',
						}),
						title: fields.text({ label: 'Название направления' }),
						desc: fields.text({ label: 'Описание направления', multiline: true }),
						link: fields.text({ label: 'URL ссылки' }),
						linkText: fields.text({ label: 'Текст ссылки' }),
					}),
					{ label: 'Направления', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'Заголовок SEO-блока' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
			},
		}),
		'ai-real-estate': singleton({
			label: 'Отрасль: Недвижимость',
			path: 'src/content/pages/ai-real-estate/index',
			previewUrl: '/ai-real-estate',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				heroBadge: fields.text({ label: 'Бейдж в Hero' }),
				heroTitleLead: fields.text({ label: 'Заголовок H1 — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок H1 — выделенное (градиент)' }),
				heroDesc: fields.text({ label: 'Описание под H1', multiline: true }),
				tools: fields.array(
					fields.object({
						iconClass: fields.select({
							label: 'Цвет иконки',
							options: [
								{ label: 'Фиолетовый', value: 'purple' },
								{ label: 'Голубой', value: 'cyan' },
							],
							defaultValue: 'purple',
						}),
						icon: fields.select({
							label: 'Иконка',
							options: [
								{ label: 'Здание / недвижимость', value: 'building' },
								{ label: 'Браузер / сайт', value: 'browser' },
								{ label: 'Задачи / чек-лист', value: 'tasks' },
								{ label: 'Код', value: 'code' },
								{ label: 'Ссылка / интеграция', value: 'link' },
								{ label: 'Поиск / SEO', value: 'search' },
								{ label: 'Аналитика / график', value: 'chart' },
								{ label: 'База данных / парсинг', value: 'database' },
							],
							defaultValue: 'browser',
						}),
						title: fields.text({ label: 'Название инструмента' }),
						link: fields.text({ label: 'URL инструмента' }),
						code: fields.text({ label: 'Технический код инструмента' }),
						desc: fields.text({ label: 'Описание', multiline: true }),
						prices: fields.array(
							fields.object({
								label: fields.text({ label: 'Название цены' }),
								value: fields.text({ label: 'Значение цены' }),
							}),
							{ label: 'Цены', itemLabel: (p) => p.fields.label.value }
						),
						linkText: fields.text({ label: 'Текст кнопки (Подробнее)' }),
					}),
					{ label: 'Инструменты', itemLabel: (p) => p.fields.title.value }
				),
				seoTitle: fields.text({ label: 'SEO Заголовок' }),
				seoRich: fields.document({
					label: 'SEO-текст (визуальный редактор)',
					formatting: true,
					links: true,
				}),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
				blogTitleLead: fields.text({ label: 'Заголовок блога — начало' }),
				blogTitleAccent: fields.text({ label: 'Заголовок блога — выделенное (градиент)' }),
				blogSub: fields.text({ label: 'Подзаголовок блока блога' }),
				blogTag: fields.text({ label: 'Тег для фильтрации блога (например, недвижимость)' }),
			},
		}),
		'contacts': singleton({
			label: 'Страница: Контакты',
			path: 'src/content/pages/contacts/index',
			previewUrl: '/contacts',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				profile: fields.object({
					avatar: fields.text({ label: 'Путь к аватару' }),
					name: fields.text({ label: 'Имя' }),
					role: fields.text({ label: 'Должность' }),
					aboutTitle: fields.text({ label: 'Заголовок "Обо мне"' }),
					aboutHtml: fields.text({ label: 'Текст "Обо мне" (HTML)', multiline: true }),
					locationTitle: fields.text({ label: 'Заголовок локации' }),
					locationText: fields.text({ label: 'Текст локации' }),
					socialsTitle: fields.text({ label: 'Заголовок соцсетей' }),
					socials: fields.array(
						fields.object({
							link: fields.text({ label: 'Ссылка' }),
							iconClass: fields.text({ label: 'CSS класс иконки (tg, wa и т.д.)' }),
							label: fields.text({ label: 'Лейбл (aria-label)' }),
							title: fields.text({ label: 'Текст подсказки (title)' }),
							icon: fields.select({
								label: 'Иконка соцсети',
								options: [
									{ label: 'Telegram', value: 'tg' },
									{ label: 'WhatsApp', value: 'wa' },
								],
								defaultValue: 'tg',
							}),
						}),
						{ label: 'Соцсети', itemLabel: (p) => p.fields.label.value }
					),
				}, { label: 'Профиль разработчика' }),
				career: fields.object({
					title: fields.text({ label: 'Заголовок карьеры' }),
					desc: fields.text({ label: 'Описание карьеры' }),
					items: fields.array(
						fields.object({
							link: fields.text({ label: 'Ссылка на кейс/статью' }),
							number: fields.text({ label: 'Номер (01, 02...)' }),
							year: fields.text({ label: 'Годы' }),
							title: fields.text({ label: 'Заголовок этапа' }),
							desc: fields.text({ label: 'Описание этапа', multiline: true }),
						}),
						{ label: 'Этапы карьеры', itemLabel: (p) => p.fields.title.value }
					),
				}, { label: 'Карьера' }),
				agents: fields.object({
					titleLead: fields.text({ label: 'Заголовок AI-роботов — начало' }),
					titleAccent: fields.text({ label: 'Заголовок AI-роботов — выделенное (градиент)' }),
					desc: fields.text({ label: 'Описание AI-роботов', multiline: true }),
					items: fields.array(
						fields.object({
							imagePath: fields.text({ label: 'Путь к изображению агента' }),
							colorClass: fields.text({ label: 'CSS класс цвета (tg, vk, wa...)' }),
							name: fields.text({ label: 'Имя агента' }),
							desc: fields.text({ label: 'Описание агента' }),
						}),
						{ label: 'Роботы (Агенты)', itemLabel: (p) => p.fields.name.value }
					),
				}, { label: 'Отдел AI-роботов' }),
			},
		}),
		'blog-index': singleton({
			label: 'Страница: Блог (Главная)',
			path: 'src/content/pages/blog-index/index',
			previewUrl: '/blog',
			format: { data: 'json' },
			schema: {
				title: fields.text({ label: 'Meta title' }),
				description: fields.text({ label: 'Meta description', multiline: true }),
				breadcrumb: fields.text({ label: 'Хлебная крошка' }),
				heroBadge: fields.text({ label: 'Бейдж в Hero' }),
				heroTitleLead: fields.text({ label: 'Заголовок — начало' }),
				heroTitleAccent: fields.text({ label: 'Заголовок — выделенная часть' }),
				heroDesc: fields.text({ label: 'Описание под заголовком', multiline: true }),
				seoTitle: fields.text({ label: 'Заголовок SEO-блока' }),
				seoParagraphs: fields.array(fields.text({ label: 'SEO-абзац', multiline: true }), { label: 'SEO-текст (абзацы)', itemLabel: (p) => p.value.substring(0, 30) }),
				faqTitle: fields.text({ label: 'Заголовок FAQ' }),
				faqItems: fields.array(
					fields.object({
						q: fields.text({ label: 'Вопрос' }),
						a: fields.text({ label: 'Ответ', multiline: true }),
					}),
					{ label: 'Вопросы-ответы FAQ', itemLabel: (p) => p.fields.q.value }
				),
			},
		}),
	},
	collections: {
		prompts: collection({
			label: 'Промпты (каталог)',
			slugField: 'title',
			path: 'src/pages/prompts/*',
			previewUrl: '/prompts/{slug}',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Заголовок промпта' } }),
				layout: fields.text({ label: 'Layout (системное поле, не трогать)', defaultValue: '../../layouts/PromptLayout.astro' }),
				description: fields.text({ label: 'Описание (для карточки и SEO)', multiline: true }),
				category: fields.select({
					label: 'Раздел',
					options: [
						{ label: 'Недвижимость', value: 'Недвижимость' },
						{ label: 'SEO', value: 'SEO' },
						{ label: 'Контент и тексты', value: 'Контент и тексты' },
						{ label: 'Маркетинг и реклама', value: 'Маркетинг и реклама' },
						{ label: 'Продажи и лиды', value: 'Продажи и лиды' },
						{ label: 'Парсинг и данные', value: 'Парсинг и данные' },
						{ label: 'Автоматизация', value: 'Автоматизация' },
						{ label: 'Сайты и разработка', value: 'Сайты и разработка' },
					],
					defaultValue: 'Недвижимость',
				}),
				tags: fields.array(fields.text({ label: 'Тег' }), { label: 'Теги', itemLabel: (p) => p.value }),
				code: fields.text({ label: 'Код промпта (тех. идентификатор)' }),
				price: fields.text({ label: 'Цена промпта (напр. 29 000 ₽)' }),
				priceImplement: fields.text({ label: 'Цена внедрения (напр. От 135 000 ₽)' }),
				offer1Title: fields.text({ label: 'Оффер 1 — заголовок' }),
				offer1Desc: fields.text({ label: 'Оффер 1 — описание', multiline: true }),
				offer1Features: fields.array(fields.text({ label: 'Пункт' }), { label: 'Оффер 1 — пункты', itemLabel: (p) => p.value }),
				offer1Btn: fields.text({ label: 'Оффер 1 — текст кнопки' }),
				offer1Label: fields.text({ label: 'Оффер 1 — плашка' }),
				offer2Title: fields.text({ label: 'Оффер 2 — заголовок' }),
				offer2Desc: fields.text({ label: 'Оффер 2 — описание', multiline: true }),
				offer2Features: fields.array(fields.text({ label: 'Пункт' }), { label: 'Оффер 2 — пункты', itemLabel: (p) => p.value }),
				offer2Btn: fields.text({ label: 'Оффер 2 — текст кнопки' }),
				offer2Label: fields.text({ label: 'Оффер 2 — плашка' }),
				content: fields.markdoc({ label: 'Тело промпт-страницы', extension: 'md' }),
			},
		}),
		blog: collection({
			label: 'Блог (Статьи)',
			slugField: 'title',
			path: 'src/pages/blog/*',
			previewUrl: '/blog/{slug}',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Заголовок' } }),
				layout: fields.text({ label: 'Layout (системное поле, не трогать)', defaultValue: '../../layouts/BlogLayout.astro' }),
				description: fields.text({ label: 'Описание (description)', multiline: true }),
				date: fields.text({ label: 'Дата (например, 04.06.2026)' }),
				category: fields.select({
					label: 'Категория',
					options: [
						{ label: 'Кейсы', value: 'Кейсы' },
						{ label: 'Индустрия', value: 'Индустрия' },
						{ label: 'Карьера', value: 'Карьера' },
					],
					defaultValue: 'Кейсы',
				}),
				readTime: fields.text({ label: 'Время чтения (например, 5 мин чтения)' }),
				tags: fields.array(fields.text({ label: 'Тег' }), { label: 'Теги', itemLabel: (p) => p.value }),
				image: fields.text({ label: 'Путь к картинке (например, /images/blog/название.webp)' }),
				content: fields.markdoc({
					label: 'Контент статьи',
					extension: 'md',
				}),
			},
		}),
	},
});
