import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/admin";
import AdminUserRow from "@/components/AdminUserRow";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  email: string;
  role: string;
  aura_balance: number;
  topped_up: string | null;
  created_at: string;
}

function rowsOf(r: unknown): Row[] {
  if (Array.isArray(r)) return r as Row[];
  const rr = (r as { rows?: unknown })?.rows;
  return Array.isArray(rr) ? (rr as Row[]) : [];
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const like = `%${query}%`;

  const res = await db.execute(sql`
    select u.id, u.email, u.role, u.aura_balance, u.created_at,
      (select coalesce(sum(p.amount_rub),0) from payments p
        where p.user_id = u.id and p.status = 'succeeded') as topped_up
    from users u
    ${query ? sql`where u.email ilike ${like}` : sql``}
    order by u.created_at desc
    limit 50
  `);
  const rows = rowsOf(res);

  return (
    <div>
      <h1 className="font-display text-2xl text-[var(--bone)]">Пользователи</h1>

      <form method="get" className="mt-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="Поиск по email"
          className="w-full max-w-md rounded-lg border border-[var(--ink-600)] bg-[var(--ink-900)] px-4 py-2.5 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]"
        />
      </form>

      <p className="mt-3 text-xs text-[var(--muted)]">
        {query ? `Найдено: ${rows.length}` : `Последние ${rows.length}`}
        {" · выдача aura не тратит ваш баланс"}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--ink-600)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ink-600)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
              <th className="px-4 py-3 font-normal">Email</th>
              <th className="px-4 py-3 font-normal">Баланс</th>
              <th className="px-4 py-3 font-normal">Пополнил</th>
              <th className="px-4 py-3 font-normal">Роль</th>
              <th className="px-4 py-3 font-normal">Регистрация</th>
              <th className="px-4 py-3 font-normal">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[var(--muted)]">
                  Ничего не найдено
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <AdminUserRow
                  key={u.id}
                  email={u.email}
                  role={u.role}
                  balance={Number(u.aura_balance)}
                  toppedUp={Number(u.topped_up ?? 0)}
                  createdAt={u.created_at}
                  isFounder={u.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
