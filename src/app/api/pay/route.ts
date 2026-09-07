import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { priceFor, type PayPurpose } from "@/lib/pricing";
import { spend } from "@/lib/wallet";

export const runtime = "nodejs";

// Списание aura за покупку. Клиент присылает только «за что» — сумму берём с сервера.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "auth required" }, { status: 401 });
  }

  // Админ ничего не тратит — всё доступно бесплатно.
  if (isAdmin(user)) {
    return Response.json({ ok: true, balance: user.auraBalance, spent: 0 });
  }

  const body = (await req.json().catch(() => null)) as {
    kind?: unknown;
    readingKey?: unknown;
  } | null;

  let purpose: PayPurpose | null = null;
  if (body && typeof body.kind === "string") {
    if (body.kind === "reading" && typeof body.readingKey === "string") {
      purpose = { kind: "reading", readingKey: body.readingKey };
    } else if (
      body.kind === "chat-addon" ||
      body.kind === "matrix-full" ||
      body.kind === "day-deep"
    ) {
      purpose = { kind: body.kind };
    }
  }

  const price = purpose && priceFor(purpose);
  if (!price) {
    return Response.json({ error: "unknown purpose" }, { status: 400 });
  }

  const result = await spend(user.id, price.amount, price.ref);
  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: "insufficient",
        balance: result.balance,
        price: price.amount,
        need: result.need,
      },
      { status: 402 },
    );
  }

  return Response.json({ ok: true, balance: result.balance, spent: price.amount });
}
