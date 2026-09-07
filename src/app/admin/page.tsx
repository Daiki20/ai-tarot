import { Suspense } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mskDayStart, mskDateStr, mskDayStartOf } from "@/lib/time";
import PeriodPicker from "@/components/PeriodPicker";

export const dynamic = "force-dynamic";

const DAY = 86400_000;

function fmt(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString("ru-RU");
}

function rowsOf(r: unknown): Record<string, unknown>[] {
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  const rr = (r as { rows?: unknown })?.rows;
  return Array.isArray(rr) ? (rr as Record<string, unknown>[]) : [];
}
async function scalar(q: Promise<unknown>): Promise<number> {
  return Number(rowsOf(await q)[0]?.v ?? 0);
}
async function list(q: Promise<unknown>): Promise<Record<string, unknown>[]> {
  return rowsOf(await q);
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-[var(--bone)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function resolveRange(sp: {
  period?: string;
  from?: string;
  to?: string;
}): { start: Date; end: Date; startStr: string; endStr: string; label: string } {
  const today = mskDayStart();
  const iso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  if (sp.from && sp.to && iso(sp.from) && iso(sp.to)) {
    const start = mskDayStartOf(sp.from);
    const end = new Date(mskDayStartOf(sp.to).getTime() + DAY);
    return {
      start,
      end,
      startStr: sp.from,
      endStr: mskDateStr(end),
      label: `${sp.from.split("-").reverse().join(".")} – ${sp.to.split("-").reverse().join(".")}`,
    };
  }

  switch (sp.period) {
    case "yesterday":
      return {
        start: new Date(today.getTime() - DAY),
        end: today,
        startStr: mskDateStr(new Date(today.getTime() - DAY)),
        endStr: mskDateStr(today),
        label: "вчера",
      };
    case "7d":
      return {
        start: new Date(today.getTime() - 6 * DAY),
        end: new Date(today.getTime() + DAY),
        startStr: mskDateStr(new Date(today.getTime() - 6 * DAY)),
        endStr: mskDateStr(new Date(today.getTime() + DAY)),
        label: "за 7 дней",
      };
    case "30d":
      return {
        start: new Date(today.getTime() - 29 * DAY),
        end: new Date(today.getTime() + DAY),
        startStr: mskDateStr(new Date(today.getTime() - 29 * DAY)),
        endStr: mskDateStr(new Date(today.getTime() + DAY)),
        label: "за 30 дней",
      };
    case "all":
      return {
        start: new Date(0),
        end: new Date(today.getTime() + DAY),
        startStr: "2000-01-01",
        endStr: mskDateStr(new Date(today.getTime() + DAY)),
        label: "за всё время",
      };
    default:
      return {
        start: today,
        end: new Date(today.getTime() + DAY),
        startStr: mskDateStr(today),
        endStr: mskDateStr(new Date(today.getTime() + DAY)),
        label: "сегодня",
      };
  }
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const r = resolveRange(sp);
  const { start, end } = r;

  const [
    regTotal,
    reg,
    visits,
    paidRub,
    paidCount,
    reads,
    auraGranted,
    auraSpent,
    paidAllRub,
    paidAllCount,
    auraOnHands,
    readsAll,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    scalar(db.execute(sql`select count(*)::int v from users`)),
    scalar(db.execute(sql`select count(*)::int v from users where created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select coalesce(sum(count),0)::int v from daily_visits where day >= ${r.startStr} and day < ${r.endStr}`)),
    scalar(db.execute(sql`select coalesce(sum(amount_rub),0) v from payments where status = 'succeeded' and created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select count(*)::int v from payments where status = 'succeeded' and created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select count(*)::int v from readings where created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select coalesce(sum(amount),0)::int v from transactions where kind = 'bonus' and created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select coalesce(sum(-amount),0)::int v from transactions where kind = 'spend' and created_at >= ${start} and created_at < ${end}`)),
    scalar(db.execute(sql`select coalesce(sum(amount_rub),0) v from payments where status = 'succeeded'`)),
    scalar(db.execute(sql`select count(*)::int v from payments where status = 'succeeded'`)),
    scalar(db.execute(sql`select coalesce(sum(aura_balance),0)::int v from users`)),
    scalar(db.execute(sql`select count(*)::int v from readings`)),
    list(db.execute(sql`select u.email, p.amount_rub, p.aura, p.created_at from payments p join users u on u.id = p.user_id where p.status = 'succeeded' order by p.created_at desc limit 10`)),
    list(db.execute(sql`select email, created_at from users order by created_at desc limit 10`)),
  ]);

  const conv = visits > 0 ? Math.round((reg / visits) * 100) : 0;
  const avgCheck = paidCount > 0 ? Math.round(Number(paidRub) / paidCount) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-[var(--bone)]">Дашборд</h1>
        <span className="text-xs text-[var(--muted)]">Дни — по Москве</span>
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <PeriodPicker />
        </Suspense>
      </div>

      <p className="mt-3 text-xs uppercase tracking-wider text-[var(--gold-soft)]">
        Период: {r.label}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Регистрации" value={fmt(reg)} />
        <Stat label="Посетители" value={fmt(visits)} />
        <Stat label="Конверсия" value={`${conv}%`} sub={`${fmt(reg)} рег. из ${fmt(visits)} визитов`} />
        <Stat label="Оплачено" value={`${fmt(paidRub)} ₽`} sub={`${fmt(paidCount)} платежей · средний чек ${fmt(avgCheck)} ₽`} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Раскладов сделано" value={fmt(reads)} />
        <Stat label="Выдано aura (бонусы)" value={fmt(auraGranted)} />
        <Stat label="Потрачено aura" value={fmt(auraSpent)} />
        <Stat label="Средний чек" value={`${fmt(avgCheck)} ₽`} />
      </div>

      <p className="mt-8 text-xs uppercase tracking-wider text-[var(--muted)]">
        За всё время
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Всего аккаунтов" value={fmt(regTotal)} />
        <Stat label="Оплачено всего" value={`${fmt(paidAllRub)} ₽`} sub={`${fmt(paidAllCount)} платежей`} />
        <Stat label="Aura на руках" value={fmt(auraOnHands)} />
        <Stat label="Раскладов всего" value={fmt(readsAll)} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
          <h2 className="font-display text-lg text-[var(--gold-soft)]">Последние оплаты</h2>
          {recentPayments.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Пока нет.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--ink-600)] text-sm">
              {recentPayments.map((row, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-[var(--bone-dim)]">{String(row.email)}</span>
                  <span className="shrink-0 text-[var(--gold-soft)]">
                    {fmt(row.amount_rub as string)} ₽ · {fmt(row.aura as number)} aura
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
          <h2 className="font-display text-lg text-[var(--gold-soft)]">Последние регистрации</h2>
          <ul className="mt-3 divide-y divide-[var(--ink-600)] text-sm">
            {recentUsers.map((row, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-[var(--bone-dim)]">{String(row.email)}</span>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {new Date(row.created_at as string).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
