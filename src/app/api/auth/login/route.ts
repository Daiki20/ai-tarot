import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, natalCharts } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
  } | null;

  if (
    typeof body?.email !== "string" ||
    typeof body?.password !== "string"
  ) {
    return Response.json({ error: "Введите email и пароль" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  try {
    const row = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = row[0];
    const ok = user
      ? await verifyPassword(body.password, user.passwordHash)
      : false;
    if (!user || !ok) {
      return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    await createSession(user.id);

    const chart = await db
      .select({ id: natalCharts.id })
      .from(natalCharts)
      .where(eq(natalCharts.userId, user.id))
      .limit(1);

    return Response.json({
      ok: true,
      next: chart[0] ? "/profile" : "/onboarding/natal",
    });
  } catch (e) {
    return Response.json({ error: dbErrorMessage(e) }, { status: 503 });
  }
}
