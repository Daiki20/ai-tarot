import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, BOOTSTRAP_ADMIN_EMAIL } from "@/lib/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

// Выдать / снять админку. Только для админа. Основателя тронуть нельзя.
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!isAdmin(me)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    role?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "admin" ? "admin" : "user";

  if (!email) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  if (email === BOOTSTRAP_ADMIN_EMAIL) {
    return Response.json(
      { error: "нельзя менять роль основателя" },
      { status: 400 },
    );
  }

  const updated = await db
    .update(users)
    .set({ role })
    .where(eq(users.email, email))
    .returning({ email: users.email, role: users.role });

  if (updated.length === 0) {
    return Response.json({ error: "user not found" }, { status: 404 });
  }
  return Response.json({ ok: true, ...updated[0] });
}
