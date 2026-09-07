import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { credit } from "@/lib/wallet";
import { getPayment, yookassaConfigured } from "@/lib/yookassa";

/**
 * Сверить «висящие» платежи пользователя со статусом в ЮKassa и зачислить успешные.
 * Работает без вебхука — вызывается при возврате со страницы оплаты (/profile).
 * Идемпотентно: зачисляет только если payments.credited_at ещё пуст.
 */
export async function reconcilePending(
  userId: string,
): Promise<{ credited: number }> {
  if (!yookassaConfigured()) return { credited: 0 };

  const pending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "pending")));

  let credited = 0;
  for (const row of pending) {
    let verified;
    try {
      verified = await getPayment(row.id);
    } catch {
      continue;
    }
    if (verified.status === "succeeded" && !row.creditedAt) {
      await credit(row.userId, row.aura, "topup", `yookassa:${row.id}`, {
        amountRub: row.amountRub,
      });
      await db
        .update(payments)
        .set({ status: "succeeded", creditedAt: new Date() })
        .where(eq(payments.id, row.id));
      credited += row.aura;
    } else if (verified.status === "canceled") {
      await db
        .update(payments)
        .set({ status: "canceled" })
        .where(eq(payments.id, row.id));
    }
  }
  return { credited };
}
