# База данных

Если спросили «где база данных» — она здесь.

## Где живёт

- **Прод:** [Neon](https://neon.tech) — облачный PostgreSQL. Проект `taro`.
  Строка подключения: `DATABASE_URL` в `.env.local` (в git не попадает).
- **Локально:** `docker-compose.yml` поднимает Postgres 16 на `:5432`
  (логин/пароль/база: `taro`). Тогда
  `DATABASE_URL=postgres://taro:taro@localhost:5432/taro`.

Подробнее про провайдера и строку — [EXTERNAL-SERVICES.md](./EXTERNAL-SERVICES.md).

## Что где лежит

| Что | Файл |
| --- | --- |
| Схема (единственный источник правды) | `src/lib/db/schema.ts` |
| Подключение (Drizzle + пул `pg`, авто-SSL для облака) | `src/lib/db/index.ts` |
| Понятные сообщения об ошибках БД | `src/lib/db/errors.ts` |
| Миграции (сгенерированный SQL) | `src/lib/db/migrations/` |
| Конфиг drizzle-kit (сам читает `.env.local`) | `drizzle.config.ts` |

## Команды

```bash
npm run db:generate   # сгенерировать миграцию из изменений схемы
npm run db:migrate    # применить миграции к базе из DATABASE_URL
npm run db:push       # (dev) залить схему без файла миграции
npm run db:studio     # веб-просмотр данных
```

Запуск с нуля: `docker compose up -d` → `npm run db:migrate` → `npm run dev`.
`docker compose down -v` — снести локальную БД с данными.

## Таблицы

### `users`
Аккаунт. `id` (uuid), `email` (уникальный), `password_hash` (bcrypt),
`natal_completed_at` (timestamp; `null` = натальная карта ещё не заполнена),
`created_at`.

### `sessions`
Серверные сессии. `id` = **сам токен** из httpOnly-куки `taro_session` (случайные
32 байта base64url), `user_id` → `users`, `expires_at` (TTL 30 дней), `created_at`.
Индекс по `user_id`.

### `natal_charts`
Натальная карта пользователя, **1:1** (`user_id` уникальный).
- Введённые данные: `name`, `gender`, `birth_date`, `birth_time` (null если неизвестно),
  `birth_time_known`, `birth_place_query` (как ввёл), `birth_place_label` (как распознал
  геокодер), `birth_lat`, `birth_lon`, `birth_tz` (IANA).
- Расчёт: `chart` (**jsonb** — вся структура натальной карты, см. [NATAL-CHART.md](./NATAL-CHART.md)),
  `summary` (плотный текст для промптов ИИ).
- `created_at`, `updated_at`.

### `readings`
История раскладов. Каждая строка привязана к `user_id` и `natal_chart_id`
(оба `on delete set null`). Поля: `kind` (`spread` | `matrix` | `day`), `spread_id`,
`reading_key` (id продукта-витрины), `question`, `card_count`, `cards` (jsonb),
`result` (jsonb), `created_at`. Индекс по `user_id`.

Пишется в `src/app/api/reading/route.ts` после завершения стрима (best-effort,
только для залогиненных).

## Типы Drizzle

`schema.ts` экспортирует `User`, `Session`, `NatalChart`, `Reading`
(`typeof table.$inferSelect`).

## Особенность jsonb

Postgres `jsonb` **не сохраняет порядок ключей объекта** (массивы — сохраняет).
Поэтому в UI, где порядок важен (например баланс стихий), он задаётся явными
списками — см. `Bar` в `src/components/NatalChartView.tsx`.

## Гостевой режим и падение БД

- Гость без куки сессии не делает ни одного запроса к БД (см. `getCurrentUser()`).
- Если БД недоступна, `getCurrentUser()` и `getNatalContext()` ловят ошибку и
  возвращают `null` — сайт деградирует до «не залогинен», а не падает целиком.
- В auth-роутах ошибка БД превращается в `503` с понятным текстом (`dbErrorMessage`).
