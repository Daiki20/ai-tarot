import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, validateCredentials } from "@/lib/auth/password";
import { createSession } from "@/lib/auth";
import { credit } from "@/lib/wallet";
import { REGISTER_BONUS } from "@/lib/pricing";
import { dbErrorMessage } from "@/lib/db/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
  } | null;

  const err = validateCredentials(body?.email, body?.password);
  if (err) return Response.json({ error: err }, { status: 400 });

  const email = (body!.email as string).trim().toLowerCase();
  const password = body!.password as string;

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      return Response.json(
        { error: "Пользователь с таким email уже есть" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id });

    await createSession(inserted[0].id);

    // Стартовый бонус на баланс (в леджер попадёт как kind='bonus').
    await credit(inserted[0].id, REGISTER_BONUS, "bonus", "signup").catch(
      (e) => console.error("[register] bonus credit failed:", e),
    );
  } catch (e) {
    return Response.json({ error: dbErrorMessage(e) }, { status: 503 });
  }

  // Следующий шаг обязателен — натальная карта.
  return Response.json({ ok: true, next: "/onboarding/natal" });
}
