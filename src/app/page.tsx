import Image from "next/image";
import { READINGS } from "@/data/readings";
import { cardsWordNominative } from "@/lib/pluralize";
import { getCurrentUser } from "@/lib/auth";
import { REGISTER_BONUS } from "@/lib/pricing";
import ReadingIcon from "@/components/ReadingIcon";
import GatedLink from "@/components/GatedLink";
import AuraMark from "@/components/AuraMark";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Price from "@/components/Price";

const READING_CARDS = READINGS.filter((r) => !r.anchor);
const ANCHOR_READING = READINGS.find((r) => r.anchor);

const ANCHOR_FEATURES = [
  {
    label: `${ANCHOR_READING?.cards ?? 12} карт`,
    sub: "Глубокий разбор",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="5" width="10" height="15" rx="1.5" transform="rotate(-8 9 12)" />
        <rect x="10" y="4" width="10" height="15" rx="1.5" transform="rotate(8 15 12)" />
      </svg>
    ),
  },
  {
    label: "Диалог с AI",
    sub: "Ответит на все вопросы",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Личная стратегия",
    sub: "Конкретные шаги",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const authed = !!(await getCurrentUser());

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="stage-light absolute inset-0 pointer-events-none" />
          <div className="relative mx-auto max-w-[1620px] px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div className="min-w-0">
              <p className="eyebrow mb-6">Лучший ИИ-таролог онлайн</p>
              <h1 className="font-display text-[2rem] leading-[1.1] sm:text-[2.75rem] lg:text-[3.5rem] sm:leading-[1.08] text-[var(--bone)]">
                Узнайте, что карты говорят о{" "}
                <span className="italic text-[var(--gold-soft)]">вашей ситуации</span>
              </h1>
              <p className="mt-5 sm:mt-6 max-w-md text-[var(--bone-dim)] leading-relaxed">
                Просто задайте вопрос обычными словами. AI-таролог сам выберет
                подходящий расклад, откроет карты и объяснит их значение — без
                эзотерических терминов.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="#readings"
                  className="btn-gold rounded-full px-7 py-3 text-sm"
                >
                  Задать вопрос картам
                </a>
                <a
                  href="#free"
                  className="btn-ghost rounded-full px-6 py-3 text-sm"
                >
                  Начать бесплатно
                </a>
              </div>

              <p className="mt-5 text-xs text-[var(--muted)]">
                Первый короткий расклад — бесплатно и без регистрации.
              </p>
            </div>

            {/* Одна карта как предмет искусства: паспарту, мягкий свет */}
            <div className="justify-self-center relative w-full max-w-[300px]">
              <div aria-hidden className="card-halo" />
              <div
                className="relative rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-4 sm:p-5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]"
                style={{ rotate: "1.5deg" }}
              >
                <div className="rounded-md border border-[var(--gold-deep)] overflow-hidden bg-[#efe7d6] p-3">
                  <Image
                    src="/cards/a-18.svg"
                    alt="Карта Таро «Луна»"
                    width={300}
                    height={527}
                    priority
                    className="block h-auto w-full"
                  />
                </div>
                <p className="mt-4 text-center eyebrow">Луна · XVIII</p>
              </div>
            </div>
          </div>
        </section>

        <hr className="hairline mx-auto max-w-[1620px]" />

        {/* ─── Расклады ─────────────────────────────────────────── */}
        <section id="readings" className="mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
          <div className="mb-12">
            <p className="eyebrow mb-3">Расклады</p>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--bone)]">
              Выберите вопрос — остальное сделает AI
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {READING_CARDS.map((r) => (
              <GatedLink
                key={r.id}
                href={`${r.href}?r=${r.id}`}
                authed={authed}
                className="lift group flex flex-col rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-6 hover:border-[var(--gold-deep)]"
              >
                <div className="icon-halo w-16 h-16 grid place-items-center rounded-2xl border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.06)] text-[var(--gold)]">
                  <ReadingIcon id={r.id} className="w-9 h-9" />
                </div>

                <h3 className="font-display text-2xl text-[var(--gold-soft)] mt-5">
                  {r.title}
                </h3>
                <p className="mt-1 text-sm italic text-[var(--muted)]">
                  {r.question}
                </p>
                <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed flex-1">
                  {r.blurb}
                </p>

                {r.chat && (
                  <span className="mt-4 self-start inline-flex items-center gap-1.5 rounded-full border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.06)] px-2.5 py-1 text-[11px] text-[var(--gold-soft)]">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
                    </svg>
                    Диалог с AI-тарологом · бесплатно
                  </span>
                )}

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--ink-600)] pt-4">
                  <span className="text-xs text-[var(--muted)]">
                    {r.cards} {cardsWordNominative(r.cards)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-1.5 text-sm font-semibold text-[#1a1408] transition-colors group-hover:bg-[var(--gold-soft)]">
                    <Price amount={r.price} />
                    <span className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </div>
              </GatedLink>
            ))}
          </div>

          {ANCHOR_READING && (
            <GatedLink
              authed={authed}
              href={`${ANCHOR_READING.href}?r=${ANCHOR_READING.id}`}
              style={{
                backgroundImage:
                  "linear-gradient(115deg, rgba(201,163,95,0.1), rgba(201,163,95,0.02) 45%, transparent 72%)",
                boxShadow: "inset 0 1px 0 rgba(227,200,143,0.14)",
              }}
              className="lift group mt-4 flex flex-col gap-8 rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-8 hover:border-[var(--gold)] lg:flex-row lg:items-center"
            >
              <div className="flex gap-5 lg:w-80 lg:shrink-0">
                <div className="icon-halo h-16 w-16 shrink-0 grid place-items-center rounded-2xl border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.06)] text-[var(--gold)]">
                  <ReadingIcon id={ANCHOR_READING.id} className="h-10 w-10" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="font-display text-2xl text-[var(--gold-soft)]">
                      {ANCHOR_READING.title}
                    </h3>
                    <span className="rounded-full border border-[var(--gold-deep)] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--gold-soft)]">
                      большой разбор
                    </span>
                  </div>
                  <p className="mt-1 text-sm italic text-[var(--muted)]">
                    {ANCHOR_READING.question}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap gap-x-8 gap-y-4 lg:justify-center">
                {ANCHOR_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <span className="text-[var(--gold)]">{f.icon}</span>
                    <span className="leading-tight">
                      <span className="block text-sm text-[var(--bone)]">
                        {f.label}
                      </span>
                      <span className="block text-xs text-[var(--muted)]">
                        {f.sub}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="shrink-0 text-center">
                <span className="btn-gold inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm">
                  Получить расклад
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
                <span className="mt-2 block text-xs text-[var(--muted)]">
                  <Price amount={ANCHOR_READING.price} /> · разовая оплата
                </span>
              </div>
            </GatedLink>
          )}
        </section>

        <hr className="hairline mx-auto max-w-[1620px]" />

        {/* ─── AI-Таролог ───────────────────────────────────────── */}
        <section id="ai" className="mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 items-center">
            <div>
              <p className="eyebrow mb-3">AI-Таролог</p>
              <h2 className="font-display text-3xl sm:text-4xl text-[var(--bone)]">
                Не генератор текста, а{" "}
                <span className="italic text-[var(--gold-soft)]">разговор</span>
              </h2>
              <p className="mt-5 text-[var(--bone-dim)] leading-relaxed">
                Расскажите, что вас беспокоит. AI-таролог задаст уточняющие
                вопросы, сделает расклад и разберёт его карта за картой. А потом
                вы просто продолжаете спрашивать.
              </p>
              <p className="mt-4 text-[var(--bone-dim)] leading-relaxed">
                Он{" "}
                <span className="text-[var(--gold-soft)]">
                  помнит ваши прошлые расклады
                </span>{" "}
                — и отвечает с учётом того, что уже выпадало.
              </p>
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                К раскладам «Карьера и деньги» и «Полный расклад» диалог идёт{" "}
                <span className="text-[var(--gold-soft)]">бесплатно</span> —
                доплачивать не нужно. К остальным — доступ к диалогу за{" "}
                <Price amount={49} className="text-[var(--gold-soft)]" />.
              </p>
            </div>

            {/* Статичное превью диалога */}
            <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="max-w-[80%] rounded-lg rounded-tl-sm bg-[var(--ink-700)] px-4 py-3 text-sm text-[var(--bone-dim)]">
                  Расскажите, что сейчас беспокоит вас больше всего.
                </div>
                <div className="max-w-[80%] ml-auto rounded-lg rounded-tr-sm border border-[var(--ink-600)] px-4 py-3 text-sm text-[var(--bone)]">
                  У нас с девушкой постоянные ссоры, я не понимаю почему.
                </div>
                <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-[var(--ink-700)] px-4 py-3 text-sm text-[var(--bone-dim)]">
                  Тогда посмотрим не только на текущую ситуацию, но и на скрытые
                  причины. Сосредоточьтесь на вопросе — я открываю первую карту…
                </div>
              </div>

              {/* Имитация строки ввода — «пользователь печатает» */}
              <div className="flex items-center gap-2.5 border-t border-[var(--ink-600)] bg-[var(--ink-900)]/40 px-3 py-3">
                <div className="flex-1 rounded-full border border-[var(--ink-600)] bg-[var(--ink-900)] px-4 py-2.5 text-sm text-[var(--bone)]">
                  И что же мне делать?
                  <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-[var(--gold)] motion-safe:animate-pulse" />
                </div>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[#1a1408]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .69.71 1.18 1.39.91z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <a
            href="#readings"
            className="btn-gold rounded-full px-7 py-3 text-sm inline-block mt-10"
          >
            Выбрать расклад
          </a>
        </section>

        <hr className="hairline mx-auto max-w-[1620px]" />

        {/* ─── Бесплатные инструменты ───────────────────────────── */}
        <section id="free" className="mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
          <p className="eyebrow mb-3">Бесплатно, без регистрации</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--bone)] mb-12">
            С чего начать
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                id: "sun",
                title: "Карта дня",
                text: "Одна карта на сегодня — тон дня и короткая подсказка.",
                href: "/spread/day",
                cta: "Вытянуть карту",
                gated: false,
              },
              {
                id: "matrix",
                title: "Матрица судьбы",
                text: "Дата рождения раскладывается на арканы: характер, ресурс, предназначение.",
                href: "/matrix",
                cta: "Рассчитать",
                gated: true,
              },
              {
                id: "full",
                title: "Значения карт",
                text: "Справочник всех 78 карт — прямое и перевёрнутое значение.",
                href: "/cards",
                cta: "Открыть справочник",
                gated: false,
              },
            ].map((t) => (
              <GatedLink
                key={t.id}
                href={t.href}
                authed={authed}
                gated={t.gated}
                className="lift group flex flex-col rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-6 hover:border-[var(--gold-deep)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="icon-halo h-16 w-16 grid place-items-center rounded-2xl border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.06)] text-[var(--gold)]">
                    <ReadingIcon id={t.id} className="h-9 w-9" />
                  </div>
                  <span className="rounded-full bg-[var(--gold)] text-[#1a1408] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                    Бесплатно
                  </span>
                </div>
                <h3 className="font-display text-2xl text-[var(--gold-soft)] mt-5">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed flex-1">
                  {t.text}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 border-t border-[var(--ink-600)] pt-4 text-xs text-[var(--gold)]">
                  {t.cta}
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </GatedLink>
            ))}
          </div>
        </section>

        {/* ─── Хук на регистрацию ───────────────────────────────── */}
        <section className="mx-auto max-w-[1620px] px-4 sm:px-6 pb-20 sm:pb-24">
          <div className="rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] px-8 py-10 text-center">
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--gold-soft)]">
              Сделайте первый расклад
            </h2>
            <p className="mt-3 text-sm text-[var(--bone-dim)] max-w-xl mx-auto leading-relaxed">
              Карта дня, матрица судьбы и значения карт — открыты сразу, без
              регистрации. Расклады по вашему вопросу и AI-таролог — платные;
              аккаунт нужен, чтобы хранить историю раскладов и продолжать диалог.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--gold-soft)]">
              <AuraMark className="inline-block h-[1em] w-[1em] text-[var(--gold)]" />
              И {REGISTER_BONUS}&nbsp;aura в подарок новым — скидка на первый расклад
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <a
                href="#readings"
                className="btn-gold rounded-full px-8 py-3 text-sm"
              >
                Задать вопрос картам
              </a>
              <a
                href="#free"
                className="btn-ghost rounded-full px-7 py-3 text-sm"
              >
                Начать бесплатно
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
