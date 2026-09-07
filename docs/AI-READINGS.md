# Как ИИ делает разборы

Четыре роута зовут OpenAI. У всех, кроме чата, ответ **потоковый** (NDJSON).

| Роут | Промпт-билдер + парсер | Модель (env) | Стрим |
| --- | --- | --- | --- |
| `/api/reading` | `src/lib/reading.ts` | `OPENAI_READING_MODEL` | да |
| `/api/chat` | `src/lib/chat.ts` | `OPENAI_CHAT_MODEL` | нет |
| `/api/matrix` | `src/lib/matrix-reading.ts` | `OPENAI_READING_MODEL` | да |
| `/api/day` | `src/lib/day-reading.ts` | `OPENAI_READING_MODEL` | да |

Клиент OpenAI и выбор моделей — `src/lib/openai.ts`. Ключ — `OPENAI_API_KEY` в `.env.local`.

---

## Устройство промпта

Каждый билдер возвращает массив сообщений `[{role, content}]`:

1. **`system` — «характер» (VOICE).** Тон: тёплый, спокойный, без эзотерического
   жаргона, без гарантий, без запугивания. Для расклада дополнительно жёсткая
   привязка к теме вопроса («не переходи на другие сферы жизни»).
2. **`system` — натальный блок** (только если пользователь залогинен и заполнил карту).
   Строится в `src/lib/natal/prompt.ts` → `natalSystemBlock(summary)`. Инструкция:
   «учитывай как фон личности, не пересказывай, не превращай в гороскоп, простым языком».
   Текст `summary` — из `src/lib/natal/compute.ts` → `buildSummary()`.
   Берётся из сессии сервером (`getNatalContext()`), клиент подменить не может.
3. **`user` — данные расклада**: вопрос, список позиций с картами и «опорными
   значениями», требование к формату вывода.

Для чата (`/api/chat`) вместо п.3 в system зашивается весь контекст расклада
(все карты + толкование + summary + advice), затем идёт история диалога
(последние 12 сообщений).

---

## Потоковый протокол (NDJSON)

Роут читает поток модели, парсит **построчно** (по одному JSON на строку), и
переотдаёт клиенту **свой** чистый NDJSON (отсекая мусор, дубли, markdown-заборы).
Заголовки ответа: `application/x-ndjson`, `Cache-Control: no-store`.

### `/api/reading`
```
{"type":"card","index":0,"text":"…"}     // по строке на карту, index с 0
…
{"type":"summary","text":"…"}
{"type":"advice","text":"…"}
{"type":"done"}                            // или {"type":"error"}
```
Парсер строки модели — `parseReadingLine` (`src/lib/reading.ts`).
Модель просят выдавать ровно `N карт + summary + advice` строк.

### `/api/matrix`
```
{"type":"intro","text":"…"}
{"type":"point","index":0,"text":"…"}     // 8 позиций матрицы
…
{"type":"advice","text":"…"}
{"type":"done"}
```
Парсер — `parseMatrixLine` (`src/lib/matrix-reading.ts`).

### `/api/day`
```
{"type":"section","key":"tone","text":"…"}
{"type":"section","key":"morning","text":"…"}
{"type":"section","key":"afternoon","text":"…"}
{"type":"section","key":"evening","text":"…"}
{"type":"section","key":"support","text":"…"}
{"type":"section","key":"avoid","text":"…"}
{"type":"section","key":"phrase","text":"…"}
{"type":"done"}
```
Ключи и порядок — `DAY_SECTIONS` (`src/lib/day-reading.ts`), парсер — `parseDayLine`.

### Клиентское чтение
`SpreadClient.tsx`, `MatrixClient.tsx`, `DayDeep.tsx` читают через
`res.body.getReader()`, буферизуют, режут по `\n`, `JSON.parse` каждой строки.
Все `setState` — в async-колбэках (правило eslint `react-hooks/set-state-in-effect`).

---

## Чат (`/api/chat`)

Не потоковый. Вход: `{ spreadName, question, reading, messages, kind }`.
`kind: "reading" | "matrix"` меняет формулировки в system-промпте
(«расклад» vs «Матрица судьбы»). Выход: `{ reply: string }`.
`max_tokens: 550`, история режется до 12 последних на сервере.

---

## Настройка качества/цены

- Модель разбора — `OPENAI_READING_MODEL` (сейчас `gpt-4.1`). Модель чата — дешёвая
  `gpt-4.1-mini`. Меняются в `.env.local`, код трогать не надо.
- Тон и правила — в константах `VOICE` внутри `src/lib/*-reading.ts` и `chat.ts`.
- `temperature` и `max_tokens` — в каждом роуте.
- Если у аккаунта OpenAI нет доступа к `gpt-4.1` — поставить `gpt-4o-mini` / `gpt-4o`.
