# TarvenAI

TarvenAI — сервис таро с ИИ-тарологом. Next.js 16 (App Router, Turbopack),
React 19, Tailwind v4, PostgreSQL (Neon) + Drizzle, OpenAI.

## Запуск

```bash
cp .env.example .env.local     # вписать OPENAI_API_KEY и DATABASE_URL
npm install
npm run db:migrate             # создать таблицы
npm run dev                    # http://localhost:3000
```

Локальная база вместо облачной: `docker compose up -d` и
`DATABASE_URL=postgres://taro:taro@localhost:5432/taro`.

## Документация

Полное описание проекта — в **[`docs/`](./docs/README.md)**:

| | |
| --- | --- |
| [docs/README.md](./docs/README.md) | карта проекта — начинать отсюда |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | стек, структура, рендеринг, жизненный цикл запроса |
| [docs/SETUP.md](./docs/SETUP.md) | переменные окружения, запуск, деплой |
| [docs/EXTERNAL-SERVICES.md](./docs/EXTERNAL-SERVICES.md) | внешние API: OpenAI, Neon, OpenStreetMap |
| [docs/API.md](./docs/API.md) | справочник по всем роутам |
| [docs/DATABASE.md](./docs/DATABASE.md) | где база, схема, миграции |
| [docs/AUTH.md](./docs/AUTH.md) | регистрация / вход / сессии |
| [docs/TAROT.md](./docs/TAROT.md) | карты, расклады, случайность, продукты и цены |
| [docs/AI-READINGS.md](./docs/AI-READINGS.md) | как ИИ делает разборы, промпты, стрим |
| [docs/NATAL-CHART.md](./docs/NATAL-CHART.md) | натальная карта: расчёт, колесо, влияние на расклады |
| [docs/DATA-SOURCES.md](./docs/DATA-SOURCES.md) | происхождение данных (колода, тексты, метод матрицы) |
| [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) | палитра, токены, компоненты, валюта aura |
| [docs/STUBS.md](./docs/STUBS.md) | что заглушка / не реализовано (оплата, баланс, авторизация) |

## Важно

`AGENTS.md` — этот форк Next.js с ломающими изменениями; перед правкой кода читать
`node_modules/next/dist/docs/`. Авторизация и оплата сейчас **временные заглушки**
(см. `docs/STUBS.md`); БД, ИИ, натальная карта — рабочие.
