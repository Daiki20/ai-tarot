import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { topupPack, isPayMethod } from "@/lib/pricing";
import { createPayment, yookassaConfigured } from "@/lib/yookassa";

export const runtime = "nodejs";

// Создаёт платёж в ЮKassa на пополнение баланса, отдаёт ссылку на оплату.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "auth required" }, { status: 401 });
  }
  if (!yookassaConfigured()) {
    return Response.json(
      { error: "Оплата ещё не подключена. Загляните позже." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    aura?: unknown;
    method?: unknown;
  } | null;
  const aura = typeof body?.aura === "number" ? body.aura : NaN;
  const pack = topupPack(aura);
  if (!pack) {
    return Response.json({ error: "unknown pack" }, { status: 400 });
  }
  const method = isPayMethod(body?.method) ? body.method : undefined;

  const origin = process.env.APP_URL || new URL(req.url).origin;

  try {
    const payment = await createPayment({
      amountRub: pack.price,
      description: `Пополнение баланса: ${pack.aura} aura`,
      returnUrl: `${origin}/profile?topup=done`,
      metadata: { userId: user.id, aura: String(pack.aura) },
      method,
    });

    await db.insert(payments).values({
      id: payment.id,
      userId: user.id,
      aura: pack.aura,
      amountRub: pack.price.toFixed(2),
      status: payment.status,
    });

    const url = payment.confirmation?.confirmation_url;
    if (!url) throw new Error("no confirmation url");
    return Response.json({ url });
  } catch (e) {
    console.error("[payments/create]", e);
    return Response.json(
      { error: "Не удалось создать платёж. Попробуйте позже." },
      { status: 502 },
    );
  }
}
