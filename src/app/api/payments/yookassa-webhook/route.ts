import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { credit } from "@/lib/wallet";
import { getPayment, yookassaConfigured } from "@/lib/yookassa";

export const runtime = "nodejs";

// Вебхук ЮKassa. Телу не доверяем — берём id и перепроверяем статус своими ключами.
// URL нужно прописать в личном кабинете ЮKassa: https://<домен>/api/payments/yookassa-webhook
export async function POST(req: Request) {
  if (!yookassaConfigured()) {
    return Response.json({ ok: false }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    event?: string;
    object?: { id?: string };
  } | null;
  const id = body?.object?.id;
  if (!id) return Response.json({ ok: false }, { status: 400 });

  let verified;
  try {
    verified = await getPayment(id);
  } catch (e) {
    console.error("[yookassa-webhook] verify failed", e);
    return Response.json({ ok: false }, { status: 502 });
  }

  const row = (
    await db.select().from(payments).where(eq(payments.id, id)).limit(1)
  )[0];
  if (!row) {
    // платёж не наш / не создавали — просто подтверждаем приём
    return Response.json({ ok: true });
  }

  if (verified.status === "succeeded" && !row.creditedAt) {
    await credit(row.userId, row.aura, "topup", `yookassa:${id}`, {
      amountRub: row.amountRub,
    });
    await db
      .update(payments)
      .set({ status: "succeeded", creditedAt: new Date() })
      .where(eq(payments.id, id));
  } else if (verified.status === "canceled" && row.status !== "canceled") {
    await db
      .update(payments)
      .set({ status: "canceled" })
      .where(eq(payments.id, id));
  }

  return Response.json({ ok: true });
}
