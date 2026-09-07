# Внешние сервисы и источники данных

Полный список того, что проект дёргает извне. Всего три внешних зависимости по сети:
**OpenAI**, **Neon (PostgreSQL)** и **OpenStreetMap Nominatim**. Больше ничего.

---

## 1. OpenAI API — генерация разборов

- **Что делает:** пишет текстовые разборы (расклад, диалог с тарологом, полная матрица
  судьбы, «День подробно»). Ничего кроме генерации текста.
- **Endpoint:** `https://api.openai.com` (через официальный SDK `openai`).
- **Клиент:** `src/lib/openai.ts` — `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`.
- **Ключ:** `OPENAI_API_KEY` в `.env.local`. На клиент не попадает — только route handlers.
- **Модели** (через env, чтобы менять без кода):
  | Переменная | Значение сейчас | Где используется |
  | --- | --- | --- |
  | `OPENAI_READING_MODEL` | `gpt-4.1` | `/api/reading`, `/api/matrix`, `/api/day` |
  | `OPENAI_CHAT_MODEL` | `gpt-4.1-mini` | `/api/chat` |
  | `OPENAI_MODEL` | `gpt-4o-mini` | фолбэк, если специальные не заданы |
- **Режим:** `chat.completions.create` со `stream: true`. Разборы — потоковые
  (см. [AI-READINGS.md](./AI-READINGS.md)). Чат — обычный запрос-ответ.
- **Стоимость:** порядок — доли рубля за разбор (см. историю обсуждения в проекте).
  Лимиты трат ставятся в кабинете OpenAI.
- **Замена:** поменять `src/lib/openai.ts` и `OPENAI_*` в env. Формат сообщений
  (`role`/`content`) стандартный, промпты — в `src/lib/*-reading.ts` и `chat.ts`.

---

## 2. Neon — PostgreSQL (база данных)

- **Что делает:** хранит пользователей, сессии, натальные карты, историю раскладов.
- **Провайдер:** [Neon](https://neon.tech) — облачный PostgreSQL, бесплатный тариф.
  Проект называется `taro`, ветка `production`, регион AWS US East 2 (Ohio).
- **Строка подключения:** `DATABASE_URL` в `.env.local`. Формат:
  `postgresql://<user>:<pass>@<endpoint>-pooler.<region>.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Клиент:** `src/lib/db/index.ts` — пул `pg` + Drizzle. SSL включается автоматически
  для нелокального хоста (`needsSsl()`).
- **Пароль базы** пересоздаётся в Neon одной кнопкой (Dashboard → Reset password) —
  делать при передаче проекта.
- **Локальная альтернатива:** `docker compose up -d` поднимает Postgres на `:5432`
  (логин/пароль/база: `taro`). Тогда `DATABASE_URL=postgres://taro:taro@localhost:5432/taro`.
- **Миграции:** `npm run db:migrate` (drizzle-kit). Схема — `src/lib/db/schema.ts`.
  Подробно — [DATABASE.md](./DATABASE.md).

---

## 3. OpenStreetMap Nominatim — геокодер города рождения

- **Что делает:** превращает введённый город («Санкт-Петербург, Россия») в координаты
  (широта/долгота). Нужно один раз при заполнении натальной карты.
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Клиент:** `src/lib/natal/geocode.ts` → `geocodeCity(query)`.
- **Ключ не нужен.** Требуется заголовок `User-Agent` (задан). Лимит — ~1 запрос/сек
  (для «ввёл город при регистрации» с запасом хватает). Ответ кешируется на 30 дней
  (`next: { revalidate }`).
- **Часовой пояс** по координатам дальше определяет сам движок натальной карты
  (`circular-natal-horoscope-js` содержит базу таймзон), не Nominatim.
- **Замена:** любой геокодер — контракт `geocodeCity(q): Promise<{label, lat, lon} | null>`
  не меняется. Кандидаты на замену: платный геокодер, своя база городов (GeoNames),
  автодополнение.
- **Данные:** © OpenStreetMap contributors, ODbL. Для продакшена с трафиком — поднять
  свой инстанс Nominatim или взять коммерческий тариф.

---

## Что НЕ является внешним сервисом

- **Расчёт натальной карты** — библиотека `circular-natal-horoscope-js`, работает
  локально, без сети. Своя эфемерида + база таймзон внутри пакета.
- **Значения карт, расклады, «Матрица судьбы»** — статические данные в `src/data/`
  и `src/lib/matrix.ts`. Написаны/выведены в проекте. См. [DATA-SOURCES.md](./DATA-SOURCES.md).
- **Картинки карт** — локальные SVG в `public/cards/`.
