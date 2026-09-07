# Дизайн-система

Концепция: «ночной editorial». Тёплый near-black фон, **один** антично-золотой акцент,
слоновая кость в тексте. Иерархию держат типографика и воздух, а не рамки и свечение.

## Токены (`src/app/globals.css`, `:root`)

| Переменная | Значение | Роль |
| --- | --- | --- |
| `--ink-900` | `#0b0a09` | фон страницы |
| `--ink-800` | `#110f0d` | приподнятые поверхности |
| `--ink-700` | `#191613` | карточки, панели |
| `--ink-600` | `#241f1a` | бордюры-хайрлайны |
| `--bone` | `#f3ede1` | основной текст |
| `--bone-dim` | `#cfc7b6` | вторичный текст |
| `--muted` | `#8a8073` | подписи, метки |
| `--gold` | `#c9a35f` | **единственный акцент** |
| `--gold-soft` | `#e3c88f` | заголовки, ссылки-акценты |
| `--gold-deep` | `#7a5f30` | тени золота, активные бордюры |
| `--rose` / `--rose-line` / `--rose-bg` | розовый | мягкий акцент (флагман, напряжённые аспекты) |

Tailwind v4: цвета используются как `text-[var(--gold)]` и т.п.

## Утилиты (там же)

`.font-display` (Playfair), `.hairline`, `.eyebrow` (мелкий трекинг-капс),
`.lift` (спокойный подъём карточки на ховере), `.btn-gold` / `.btn-ghost`,
`.stage-light` (пятно света за героем), `.icon-halo` (сияние за иконкой-медальоном),
`.card-halo`, `.card-flip*` / `.card-face*` / `.card-back-pattern` (механика карт),
`.card-slot` (пустая позиция), `.deck-card` / `.deck-surface` / `.spread-surface`
(колода и стол), `.fade-in` (появление кусков стрима), `.star` + `@keyframes twinkle`.
Все анимации отключаются под `prefers-reduced-motion`.

## Шрифты

`src/app/layout.tsx`: **Playfair Display** (`--font-display`) + **Inter**
(`--font-body`), `next/font/google`, сабсеты `latin` + `cyrillic`.

## Ключевые компоненты

| Компонент | Роль |
| --- | --- |
| `SiteHeader` / `SiteFooter` | шапка (auth-aware) и подвал, общий `NAV` |
| `MobileNav` | нижняя навигация на телефоне/планшете (`lg:hidden`), 5 вкладок, приподнятая центральная кнопка «Спросить» |
| `AuraMark` | значок валюты **aura** (гранёный ромб, `currentColor`) |
| `Price` | число + `AuraMark`, курс **1 aura = 1 ₽** |
| `PayModal` | окно оплаты — **мок** (см. [STUBS.md](./STUBS.md)) |
| `TarotCardView` | карта: рубашка/лицо, флип, режим клика в колоде |
| `ReadingIcon` | линейные глифы для карточек каталога раскладов |
| `Spinner` | крутящееся кольцо |
| `ChatPanel` / `ChatUpsell` | мессенджер с AI-тарологом и его допродажа |
| `NatalWheel` / `AspectGrid` / `NatalChartView` | натальная карта (см. [NATAL-CHART.md](./NATAL-CHART.md)) |
| `MatrixClient` / `NatalForm` / `DayDeep` | клиентские экраны матрицы, онбординга, «День подробно» |

## Валюта aura

- Отображается как `<число> ◈` (значок — `AuraMark`). Курс **1 aura = 1 ₽** — цены в
  `readings.ts` те же числа.
- В `PayModal` формулировка «Списать с баланса», в профиле баланс — заглушка «0».
- Реальная логика баланса/списаний — не реализована. См. [STUBS.md](./STUBS.md).

## Адаптив

- `viewport` задан в `src/app/layout.tsx` (`width=device-width`, `viewport-fit=cover`).
- `body` имеет `overflow-x: hidden` и `pb` под нижнюю навигацию.
- Стол раскладов масштабируется через CSS `zoom` (меняет и layout-размер) —
  `src/components` → логика в `SpreadClient.tsx`. `zoom` не поддержан в Firefox < 126
  (там стол в полный размер, обрежется, но не сломается).
- Проверка: `document.documentElement.scrollWidth === innerWidth` на 390px на всех
  страницах.
