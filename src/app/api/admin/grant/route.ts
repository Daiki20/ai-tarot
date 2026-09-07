import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { credit } from "@/lib/wallet";

export const runtime = "nodejs";

// Выдать пользователю aura. Только для админа. aura начисляются бесплатно (kind='bonus').
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!isAdmin(me)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    amount?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const amount = typeof body?.amount === "number" ? Math.trunc(body.amount) : NaN;

  if (!email || !Number.isInteger(amount) || amount <= 0 || amount > 1_000_000) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const target = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
  )[0];
  if (!target) {
    return Response.json({ error: "user not found" }, { status: 404 });
  }

  const balance = await credit(
    target.id,
    amount,
    "bonus",
    `admin-grant:${me!.email}`,
    { grantedBy: me!.email },
  );
  return Response.json({ ok: true, balance });
}
