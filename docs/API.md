# Справочник по роутам

Все роуты — в `src/app/api/**/route.ts`, `runtime = "nodejs"`.
Внешние endpoints, которые они дёргают — см. [EXTERNAL-SERVICES.md](./EXTERNAL-SERVICES.md).

Обозначения: **auth** — нужна кука сессии; **стрим** — ответ построчным NDJSON.

---

## Авторизация

### `POST /api/auth/register`
`src/app/api/auth/register/route.ts`
- Вход: `{ email, password }` (пароль ≥ 8 символов).
- Что делает: валидирует → проверяет уникальность email → `bcrypt.hash` → вставка в
  `users` → создаёт сессию (кука `taro_session`, httpOnly, 30 дней).
- Выход: `{ ok: true, next: "/onboarding/natal" }` — дальше обязательный шаг натальной карты.
- Ошибки: `400` валидация, `409` email занят, `503` база недоступна (сообщение из
  `src/lib/db/errors.ts` подсказывает, что запустить).

### `POST /api/auth/login`
`src/app/api/auth/login/route.ts`
- Вход: `{ email, password }`.
- `bcrypt.compare` → создаёт сессию.
- Выход: `{ ok: true, next: "/profile" | "/onboarding/natal" }` (зависит от того,
  заполнена ли натальная карта).
- Ошибки: `401` неверные данные, `503` база недоступна.

### `POST /api/auth/logout`
`src/app/api/auth/logout/route.ts` — удаляет сессию из БД и куку. `{ ok: true }`.

Механизм сессий подробно — [AUTH.md](./AUTH.md).

---

## Натальная карта

### `POST /api/natal` · auth
`src/app/api/natal/route.ts`
- Вход: `{ name, gender?, birthDate: "YYYY-MM-DD", birthTime: "HH:MM" | null,
  birthTimeKnown: boolean, birthPlace: string }`.
- Что делает:
  1. `geocodeCity(birthPlace)` → координаты (**OpenStreetMap Nominatim**).
  2. `computeNatalChart(...)` → полный расчёт (**библиотека `circular-natal-horoscope-js`**).
  3. `upsert` в `natal_charts` (1:1 с пользователем) + `users.natal_completed_at = now()`.
- Выход: `{ ok: true, chart, summary }`.
- Ошибки: `401` не залогинен, `400` невалидные поля, `422` город не распознан,
  `500` расчёт упал, `503` база недоступна.

### `POST /api/natal/geocode` · auth
`src/app/api/natal/geocode/route.ts`
- Вход: `{ q: string }`. Выход: `{ result: { label, lat, lon } | null }`.
- Предпросмотр распознавания города для формы (кнопка «Проверить»).

Что именно считается — [NATAL-CHART.md](./NATAL-CHART.md).

---

## Разборы ИИ (все дёргают **OpenAI**)

### `POST /api/reading` · стрим
`src/app/api/reading/route.ts`
- Вход: `{ spreadId, question, cards: [{cardId, reversed}], readingKey? }`.
- Валидирует: расклад существует, число карт совпадает, все `cardId` валидны.
- Берёт натальный контекст из сессии (`getNatalContext()`), собирает промпт
  (`buildReadingMessages`, `src/lib/reading.ts`), стримит OpenAI.
- Выход (NDJSON): `{type:"card",index,text}` ×N → `{type:"summary",text}` →
  `{type:"advice",text}` → `{type:"done"}` (или `{type:"error"}`).
- Побочно: при залогиненном пользователе после `done` пишет строку в `readings`
  (`user_id`, `natal_chart_id`, карты, результат).

### `POST /api/chat`
`src/app/api/chat/route.ts`
- Вход: `{ spreadName, question, reading: ReadingResult, messages: [{role,content}],
  kind: "reading" | "matrix" }`.
- Диалог с AI-тарологом после расклада (или после разбора матрицы). Помнит все карты
  и толкование (передаются в `reading`), плюс натальный контекст из сессии.
- Промпт — `buildChatMessages` (`src/lib/chat.ts`). Обычный (не потоковый) ответ:
  `{ reply: string }`. История режется до последних 12 сообщений на сервере.

### `POST /api/matrix` · стрим
`src/app/api/matrix/route.ts`
- Вход: `{ birthDate: "YYYY-MM-DD" }`.
- `computeFullMatrix(birthDate)` (8 позиций нумерологии, `src/lib/matrix.ts`) →
  промпт `buildMatrixMessages` (`src/lib/matrix-reading.ts`) → стрим OpenAI.
- Выход (NDJSON): `{type:"intro",text}` → `{type:"point",index,text}` ×8 →
  `{type:"advice",text}` → `{type:"done"}`.

### `POST /api/day` · стрим
`src/app/api/day/route.ts`
- Вход: `{ cardId, reversed }`.
- Разбор одного дня по карте дня. Промпт `buildDayMessages` (`src/lib/day-reading.ts`) →
  стрим OpenAI.
- Выход (NDJSON): `{type:"section",key,text}` ×7 (`tone`, `morning`, `afternoon`,
  `evening`, `support`, `avoid`, `phrase`) → `{type:"done"}`.

Общий протокол стрима и устройство промптов — [AI-READINGS.md](./AI-READINGS.md).

---

## Заголовки стрим-ответов

```
Content-Type: application/x-ndjson; charset=utf-8
X-Content-Type-Options: nosniff
Cache-Control: no-store
```
