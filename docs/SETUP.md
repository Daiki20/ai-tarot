# Установка и запуск

## Первый запуск

```bash
cp .env.example .env.local        # затем заполнить (см. ниже)
npm install
npm run db:migrate                # создать таблицы в базе из DATABASE_URL
npm run dev                       # http://localhost:3000
```

Для локальной базы вместо облачной — сначала `docker compose up -d` (Postgres на :5432),
и `DATABASE_URL=postgres://taro:taro@localhost:5432/taro`.

## Переменные окружения (`.env.local`)

| Переменная | Обязательна | Что это |
| --- | --- | --- |
| `OPENAI_API_KEY` | да | ключ OpenAI (platform.openai.com). Только серверная сторона. |
| `OPENAI_READING_MODEL` | нет | модель разборов, дефолт-фолбэк `gpt-4o-mini`. Сейчас `gpt-4.1`. |
| `OPENAI_CHAT_MODEL` | нет | модель диалога с тарологом. Сейчас `gpt-4.1-mini`. |
| `OPENAI_MODEL` | нет | общий фолбэк, если специальные не заданы. |
| `DATABASE_URL` | да | строка подключения к PostgreSQL. Neon в проде, docker локально. |

`.env.local` в git не попадает (`.gitignore`: `.env*`, кроме `.env.example`).
`drizzle.config.ts` сам читает `.env.local` для команд `db:*`.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер (Turbopack) |
| `npm run build` | продакшн-сборка |
| `npm run start` | запуск собранного |
| `npm run lint` | ESLint |
| `npm run db:generate` | сгенерировать миграцию из изменений схемы |
| `npm run db:migrate` | применить миграции |
| `npm run db:push` | (dev) залить схему без файла миграции |
| `npm run db:studio` | веб-просмотр БД |

## Проверки перед коммитом

```bash
npx tsc --noEmit && npx eslint src/ && npm run build
```

## Деплой

- Любая платформа с Node 20+ (Vercel, свой сервер). `npm run build && npm run start`.
- Поставить `OPENAI_API_KEY` и `DATABASE_URL` в переменные окружения платформы.
- Прогнать `npm run db:migrate` против прод-базы.
- Почти все страницы рендерятся динамически (шапка читает сессию) — это ожидаемо.
- Для трафика на геокодере (`Nominatim`) — поднять свой инстанс или взять
  коммерческий геокодер (см. [EXTERNAL-SERVICES.md](./EXTERNAL-SERVICES.md)).

## Известные предупреждения

- `pg` пишет warning про SSL-режимы `require`/`prefer` (будут трактоваться как
  `verify-full` в будущих мажорах). Безвредно; при желании — `sslmode=verify-full`
  в `DATABASE_URL`.
- `next dev` перезаписывает блок в `AGENTS.md` — коммитить вместе с изменениями,
  чтобы дерево было чистым.
