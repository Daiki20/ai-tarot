import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuraMark from "@/components/AuraMark";
import LogoutButton from "@/components/LogoutButton";
import NatalChartView from "@/components/NatalChartView";
import TopupButton from "@/components/TopupButton";
import TopupReturn from "@/components/TopupReturn";
import { getCurrentUserWithNatal } from "@/lib/auth";
import { getBalance } from "@/lib/wallet";
import { reconcilePending } from "@/lib/payments";
import { db } from "@/lib/db";
import { readings, natalCharts } from "@/lib/db/schema";
import { computeNatalChart, type NatalChart } from "@/lib/natal/compute";

export const metadata: Metadata = { title: "Профиль — TarvenAI" };

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

  // Подстраховка на случай, если вебхук ЮKassa не дошёл: при заходе на профиль
  // (в т.ч. после возврата со страницы оплаты) сверяем «висящие» платежи.
  const { credited } = await reconcilePending(user.id).catch(() => ({
    credited: 0,
  }));
  const balance =
    credited > 0
      ? await getBalance(user.id).catch(() => user.auraBalance)
      : user.auraBalance;

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
        <Suspense fallback={null}>
          <TopupReturn />
        </Suspense>
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
            <div className="rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl text-[var(--gold-soft)]">Баланс</h2>
                <span className="inline-flex items-center gap-1.5 font-display text-2xl text-[var(--bone)]">
                  {balance.toLocaleString("ru-RU")}
                  <AuraMark className="inline-block w-[0.8em] h-[0.8em] text-[var(--gold)]" />
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                Пополняете баланс, дальше расклады списываются с него. 1&nbsp;
                <AuraMark className="inline-block w-[0.85em] h-[0.85em]" /> = 1&nbsp;₽.
              </p>
              <div className="mt-4">
                <TopupButton className="btn-gold w-full rounded-full px-6 py-2.5 text-sm" />
              </div>
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
