import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mskDayStart } from "@/lib/time";

export const dynamic = "force-dynamic";

function fmt(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString("ru-RU");
}

// db.execute у drizzle (node-postgres) отдаёт QueryResult { rows }, но на всякий
// случай поддерживаем и вариант с массивом.
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

export default async function AdminDashboard() {
  const dayStart = mskDayStart();
  const weekAgo = new Date(dayStart.getTime() - 6 * 86400_000);
  const yesterdayStart = new Date(dayStart.getTime() - 86400_000);
  const todayIso = dayStart.toISOString().slice(0, 10);

  const [
    regTotal,
    regToday,
    regYesterday,
    regWeek,
    visitsToday,
    visitsWeek,
    visitsTotal,
    paidTotalRub,
    paidTotalCount,
    paidTodayRub,
    paidTodayCount,
    auraGranted,
    auraSpent,
    readingsTotal,
    readingsToday,
    recentPayments,
    recentUsers,
  ] = await Promise.all([
    scalar(db.execute(sql`select count(*)::int v from users`)),
    scalar(db.execute(sql`select count(*)::int v from users where created_at >= ${dayStart}`)),
    scalar(db.execute(sql`select count(*)::int v from users where created_at >= ${yesterdayStart} and created_at < ${dayStart}`)),
    scalar(db.execute(sql`select count(*)::int v from users where created_at >= ${weekAgo}`)),
    scalar(db.execute(sql`select coalesce(count,0)::int v from daily_visits where day = ${todayIso}`)),
    scalar(db.execute(sql`select coalesce(sum(count),0)::int v from daily_visits where day >= ${weekAgo.toISOString().slice(0,10)}`)),
    scalar(db.execute(sql`select coalesce(sum(count),0)::int v from daily_visits`)),
    scalar(db.execute(sql`select coalesce(sum(amount_rub),0) v from payments where status = 'succeeded'`)),
    scalar(db.execute(sql`select count(*)::int v from payments where status = 'succeeded'`)),
    scalar(db.execute(sql`select coalesce(sum(amount_rub),0) v from payments where status = 'succeeded' and created_at >= ${dayStart}`)),
    scalar(db.execute(sql`select count(*)::int v from payments where status = 'succeeded' and created_at >= ${dayStart}`)),
    scalar(db.execute(sql`select coalesce(sum(amount),0)::int v from transactions where kind = 'bonus'`)),
    scalar(db.execute(sql`select coalesce(sum(-amount),0)::int v from transactions where kind = 'spend'`)),
    scalar(db.execute(sql`select count(*)::int v from readings`)),
    scalar(db.execute(sql`select count(*)::int v from readings where created_at >= ${dayStart}`)),
    list(db.execute(sql`select u.email, p.amount_rub, p.aura, p.created_at from payments p join users u on u.id = p.user_id where p.status = 'succeeded' order by p.created_at desc limit 10`)),
    list(db.execute(sql`select email, created_at from users order by created_at desc limit 10`)),
  ]);

  const conv = visitsToday > 0 ? Math.round((regToday / visitsToday) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl text-[var(--bone)]">Дашборд</h1>
        <span className="text-xs text-[var(--muted)]">Дни — по Москве</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Регистрации сегодня"
          value={fmt(regToday)}
          sub={`вчера ${fmt(regYesterday)} · за 7 дней ${fmt(regWeek)} · всего ${fmt(regTotal)}`}
        />
        <Stat
          label="Посетители сегодня"
          value={fmt(visitsToday)}
          sub={`за 7 дней ${fmt(visitsWeek)} · всего ${fmt(visitsTotal)}`}
        />
        <Stat
          label="Конверсия сегодня"
          value={`${conv}%`}
          sub={`${fmt(regToday)} рег. из ${fmt(visitsToday)} визитов`}
        />
        <Stat
          label="Оплачено всего"
          value={`${fmt(paidTotalRub)} ₽`}
          sub={`${fmt(paidTotalCount)} платежей · сегодня ${fmt(paidTodayRub)} ₽ (${fmt(paidTodayCount)})`}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Раскладов сделано" value={fmt(readingsTotal)} sub={`сегодня ${fmt(readingsToday)}`} />
        <Stat label="Выдано aura (бонусы)" value={fmt(auraGranted)} />
        <Stat label="Потрачено aura" value={fmt(auraSpent)} />
        <Stat label="Всего аккаунтов" value={fmt(regTotal)} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
          <h2 className="font-display text-lg text-[var(--gold-soft)]">Последние оплаты</h2>
          {recentPayments.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">Пока нет.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--ink-600)] text-sm">
              {recentPayments.map((r, i) => {
                const row = r as { email: string; amount_rub: string; aura: number; created_at: string };
                return (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="min-w-0 truncate text-[var(--bone-dim)]">{row.email}</span>
                    <span className="shrink-0 text-[var(--gold-soft)]">
                      {fmt(row.amount_rub)} ₽ · {fmt(row.aura)} aura
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
          <h2 className="font-display text-lg text-[var(--gold-soft)]">Последние регистрации</h2>
          <ul className="mt-3 divide-y divide-[var(--ink-600)] text-sm">
            {recentUsers.map((r, i) => {
              const row = r as { email: string; created_at: string };
              return (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-[var(--bone-dim)]">{row.email}</span>
                  <span className="shrink-0 text-[var(--muted)] text-xs">
                    {new Date(row.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
