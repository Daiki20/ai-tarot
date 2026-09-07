import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";

export type SpendResult =
  | { ok: true; balance: number }
  | { ok: false; balance: number; need: number };

export async function getBalance(userId: string): Promise<number> {
  const row = await db
    .select({ b: users.auraBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0]?.b ?? 0;
}

/**
 * Списать `amount` aura. Атомарно: условный UPDATE (спишет только если хватает)
 * + запись в леджер, в одной транзакции. Клиентской сумме не доверяем — вызывающий
 * берёт цену из server-side таблицы (src/lib/pricing.ts).
 */
export async function spend(
  userId: string,
  amount: number,
  ref: string,
): Promise<SpendResult> {
  if (!Number.isInteger(amount) || amount <= 0) {
    const balance = await getBalance(userId);
    return { ok: false, balance, need: 0 };
  }

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ auraBalance: sql`${users.auraBalance} - ${amount}` })
      .where(and(eq(users.id, userId), gte(users.auraBalance, amount)))
      .returning({ balance: users.auraBalance });

    if (updated.length === 0) {
      const cur = await tx
        .select({ b: users.auraBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const balance = cur[0]?.b ?? 0;
      return { ok: false as const, balance, need: amount - balance };
    }

    const balance = updated[0].balance;
    await tx.insert(transactions).values({
      userId,
      amount: -amount,
      kind: "spend",
      ref,
      balanceAfter: balance,
    });
    return { ok: true as const, balance };
  });
}

/** Начислить aura (пополнение по вебхуку, бонус, возврат). */
export async function credit(
  userId: string,
  amount: number,
  kind: "topup" | "bonus" | "refund",
  ref: string,
  meta?: Record<string, unknown>,
): Promise<number> {
  if (!Number.isInteger(amount) || amount <= 0) return getBalance(userId);

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ auraBalance: sql`${users.auraBalance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning({ balance: users.auraBalance });

    const balance = updated[0]?.balance ?? 0;
    await tx.insert(transactions).values({
      userId,
      amount,
      kind,
      ref,
      balanceAfter: balance,
      meta: meta ?? null,
    });
    return balance;
  });
}
