import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuraMark from "@/components/AuraMark";
import LogoutButton from "@/components/LogoutButton";
import NatalChartView from "@/components/NatalChartView";
import { getCurrentUserWithNatal } from "@/lib/auth";
import { db } from "@/lib/db";
import { readings, natalCharts } from "@/lib/db/schema";
import { computeNatalChart, type NatalChart } from "@/lib/natal/compute";

export const metadata: Metadata = { title: "Профиль — AI Tarot" };

const PACKS = [
  { aura: 1000, bonus: 0 },
  { aura: 2000, bonus: 150 },
  { aura: 5000, bonus: 600 },
];

const KIND_LABEL: Record<string, string> = {
  spread: "Расклад",
  matrix: "Матрица судьбы",
  day: "Карта дня",
};

export default async function ProfilePage() {
  const ctx = await getCurrentUserWithNatal();

  // Не вошёл — предлагаем вход/регистрацию.
  if (!ctx) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
          <div className="mx-auto max-w-md rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-7 text-center">
            <h1 className="font-display text-2xl text-[var(--gold-soft)]">
              Войдите в аккаунт
            </h1>
            <p className="mt-2 text-sm text-[var(--bone-dim)] leading-relaxed">
              Аккаунт хранит вашу натальную карту, историю раскладов и баланс.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/register" className="btn-gold rounded-full px-6 py-2.5 text-sm">
                Регистрация
              </Link>
              <Link href="/login" className="btn-ghost rounded-full px-6 py-2.5 text-sm">
                Войти
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // Вошёл, но не заполнил натальную карту — на обязательный шаг.
  if (!ctx.natal) redirect("/onboarding/natal");

  const { user, natal } = ctx;
  let chart = natal.chart as NatalChart;

  // Карты старого формата (без колеса/достоинств) пересчитываем из сохранённых
  // данных рождения — расчёт детерминирован, ничего не теряется.
  const needsUpgrade =
    !Array.isArray(chart.placements) ||
    typeof chart.placements[0]?.lon !== "number" ||
    !Array.isArray(chart.stelliums) ||
    !chart.balance?.elementsPct;
  if (needsUpgrade) {
    try {
      const fresh = computeNatalChart({
        name: natal.name,
        gender: natal.gender,
        birthDate: natal.birthDate,
        birthTime: natal.birthTime,
        birthTimeKnown: natal.birthTimeKnown,
        lat: Number(natal.birthLat),
        lon: Number(natal.birthLon),
      });
      chart = fresh.chart;
      await db
        .update(natalCharts)
        .set({ chart: fresh.chart, summary: fresh.summary, updatedAt: new Date() })
        .where(eq(natalCharts.id, natal.id));
    } catch (e) {
      console.error("[profile] natal upgrade failed:", e);
    }
  }

  const history = await db
    .select({
      id: readings.id,
      kind: readings.kind,
      spreadId: readings.spreadId,
      question: readings.question,
      createdAt: readings.createdAt,
    })
    .from(readings)
    .where(eq(readings.userId, user.id))
    .orderBy(desc(readings.createdAt))
    .limit(20);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Аккаунт</p>
            <h1 className="font-display text-2xl sm:text-3xl text-[var(--bone)]">
              {user.email}
            </h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <NatalChartView chart={chart} />

          <div className="flex flex-col gap-4">
            {/* Баланс — заглушка до подключения оплаты */}
            <div className="rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl text-[var(--gold-soft)]">Баланс</h2>
                <span className="inline-flex items-center gap-1.5 font-display text-2xl text-[var(--bone)]">
                  0
                  <AuraMark className="inline-block w-[0.8em] h-[0.8em] text-[var(--gold)]" />
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                Пополняете один раз, дальше расклады списываются с баланса. 1&nbsp;
                <AuraMark className="inline-block w-[0.85em] h-[0.85em]" /> = 1&nbsp;₽.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {PACKS.map((p) => (
                  <div
                    key={p.aura}
                    className="rounded-lg border border-[var(--ink-600)] bg-[var(--ink-900)] p-3 text-center"
                  >
                    <p className="font-display text-base text-[var(--gold-soft)] inline-flex items-center gap-1">
                      +{p.aura.toLocaleString("ru-RU")}
                      <AuraMark className="inline-block w-[0.7em] h-[0.7em]" />
                    </p>
                    {p.bonus > 0 && (
                      <p className="text-[10px] text-[var(--gold)]">+{p.bonus}</p>
                    )}
                    <button
                      type="button"
                      disabled
                      className="btn-gold mt-2 w-full rounded-full px-2 py-1.5 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Пополнить
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Оплата подключается на следующем этапе.
              </p>
            </div>
          </div>
        </div>

        {/* История раскладов */}
        <div className="mt-4 rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-6 sm:p-7">
          <h2 className="font-display text-xl text-[var(--gold-soft)]">
            История раскладов
          </h2>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Пока пусто. Все расклады сохраняются сюда и учитывают вашу натальную карту.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--ink-600)]">
              {history.map((h) => (
                <li key={h.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="text-sm text-[var(--bone-dim)]">
                    {KIND_LABEL[h.kind] ?? h.kind}
                    {h.question && (
                      <span className="text-[var(--muted)]"> · «{h.question}»</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    {new Date(h.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
