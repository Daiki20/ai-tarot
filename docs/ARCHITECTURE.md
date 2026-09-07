# Архитектура

## Стек

| Слой | Технология | Заметки |
| --- | --- | --- |
| Фреймворк | Next.js **16.3.4**, App Router, Turbopack | форк с ломающими изменениями — см. `AGENTS.md`, документация в `node_modules/next/dist/docs/` |
| UI | React 19.2 | серверные компоненты по умолчанию, `"use client"` где нужна интерактивность |
| Стили | Tailwind CSS v4 (`@tailwindcss/postcss`) + CSS-переменные в `src/app/globals.css` |
| БД | PostgreSQL (Neon в проде, docker локально) + Drizzle ORM (`drizzle-orm`, драйвер `pg`) |
| ИИ | OpenAI API через `openai` npm SDK |
| Астрология | `circular-natal-horoscope-js` (чистый JS, без сети) |
| Пароли | `bcryptjs` |
| Прочее | `luxon`, `tz-lookup` — установлены, но напрямую сейчас не используются (таймзону считает движок карты); можно удалить при чистке |

Полный список — `package.json`. Скрипты: `dev`, `build`, `start`, `lint`,
`db:generate`, `db:migrate`, `db:push`, `db:studio`.

## Структура папок

```
src/
  app/
    page.tsx                    лендинг
    layout.tsx                  корневой layout, шрифты, <MobileNav/>, viewport
    globals.css                 дизайн-система (токены, утилиты, keyframes)
    cards/                      справочник 78 карт (index + [id])
    matrix/                     «Матрица судьбы» (страница-обёртка)
    spread/[id]/                движок раскладов (page.tsx + SpreadClient.tsx)
    profile/                    личный кабинет (натальная карта, история, баланс-заглушка)
    register/  login/           формы авторизации
    onboarding/natal/           обязательная форма натальной карты после регистрации
    api/
      auth/{register,login,logout}/route.ts
      reading/route.ts          разбор расклада (стрим)
      chat/route.ts             диалог с AI-тарологом
      matrix/route.ts           полный разбор «Матрицы судьбы» (стрим)
      day/route.ts              «День подробно» (стрим)
      natal/route.ts            сохранение натальной карты
      natal/geocode/route.ts    предпросмотр распознавания города
  components/                   переиспользуемые UI-компоненты
  data/
    cards.ts                    78 карт: id, название, стихия, значения, keywords
    spreads.ts                  4 движка раскладов (расстановки позиций)
    readings.ts                 7 продуктов-витрины: цены, тексты, к какому движку ведут
  lib/
    openai.ts                   клиент OpenAI + выбор моделей из env
    reading.ts / chat.ts / matrix-reading.ts / day-reading.ts   сборка промптов + парсеры стрима
    matrix.ts                   нумерология «Матрицы судьбы»
    pluralize.ts                склонение «карта/карты/карт»
    auth/                       index.ts (сессии), password.ts (хеш)
    db/                         index.ts (подключение), schema.ts, errors.ts, migrations/
    natal/                      compute.ts (расчёт), geocode.ts, context.ts, prompt.ts
docs/                           эта документация
drizzle.config.ts              конфиг миграций
docker-compose.yml             локальный Postgres
```

## Модель рендеринга

- Почти все страницы — **динамические** (`ƒ` в выводе `next build`). Причина: общий
  `SiteHeader` серверно читает куку сессии (`getCurrentUser()`), а `cookies()` делает
  страницу динамической. Это осознанный компромисс ради шапки, знающей о входе.
  Откат: вынести auth-часть шапки в клиентский островок.
- Гость без куки сессии → `getCurrentUser()` возвращает `null` **до** запроса в БД,
  поэтому лендинг для гостя не бьёт по базе.

## Жизненный цикл запроса на разбор расклада

1. Клиент (`SpreadClient.tsx`) — пользователь задаёт вопрос, тянет карты.
2. Когда все карты открыты — `fetch("/api/reading", { … cards, spreadId, question })`.
3. Роут: валидирует расклад и карты → `getNatalContext()` берёт выжимку натальной карты
   **из сессии** (не из тела запроса) → `buildReadingMessages()` собирает промпт →
   OpenAI `stream: true`.
4. Роут парсит поток модели построчно (NDJSON), отдаёт клиенту чистый NDJSON:
   `{type:"card",index,text}` … `{type:"summary"}` `{type:"advice"}` `{type:"done"}`.
5. Клиент показывает карты по мере готовности.
6. После `done`: если пользователь залогинен — расклад пишется в таблицу `readings`
   с `user_id` и `natal_chart_id`.

Подробности стрима и промптов — [AI-READINGS.md](./AI-READINGS.md).

## Безопасность (текущее состояние)

- Ключ OpenAI и `DATABASE_URL` — только в `.env.local` (в git не попадает, см. `.gitignore`).
  Никогда не уходят на клиент — все вызовы в route handlers (`runtime = "nodejs"`).
- Натальный контекст для ИИ берётся по куке сессии на сервере — клиент подменить не может.
- Авторизация намеренно минимальна и подлежит замене — см. [AUTH.md](./AUTH.md) и [STUBS.md](./STUBS.md).
- SVG-картинки карт: `next.config.ts` разрешает `dangerouslyAllowSVG` с жёстким CSP
  (`script-src 'none'; sandbox`).
