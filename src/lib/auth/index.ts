/**
 * Лёгкая авторизация «на сейчас». Задача — рабочий аккаунт + сессия, чтобы к нему
 * можно было привязать натальную карту и историю раскладов. Это НЕ финальная система:
 * разработчик, которому передадут проект, заменит её (OAuth, подтверждение почты,
 * восстановление пароля, 2FA и т.д.). Швы для замены:
 *
 *   - хеш пароля         -> src/lib/auth/password.ts  (сейчас bcryptjs)
 *   - создание/чтение    -> функции ниже + кука taro_session
 *   - таблицы            -> users, sessions в src/lib/db/schema.ts
 *   - точки входа        -> src/app/api/auth/*  (register / login / logout)
 *
 * Всё серверное. Клиент видит только куку (httpOnly), никаких токенов в JS.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, natalCharts, type User, type NatalChart } from "@/lib/db/schema";

const COOKIE = "taro_session";
const SESSION_TTL_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({ id: token, userId, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
    jar.delete(COOKIE);
  }
}

/**
 * Текущий пользователь по куке сессии, либо null. Кэша нет — держим просто.
 * Если БД недоступна — считаем «не залогинен» (сайт не должен падать целиком).
 */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const row = await db
      .select({ user: users, expiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, token))
      .limit(1);

    const found = row[0];
    if (!found) return null;
    if (found.expiresAt.getTime() < Date.now()) {
      await db.delete(sessions).where(eq(sessions.id, token));
      return null;
    }
    return found.user;
  } catch (err) {
    console.error("[auth] session lookup failed:", err);
    return null;
  }
}

/** Пользователь + его натальная карта (или null, если онбординг не завершён). */
export async function getCurrentUserWithNatal(): Promise<{
  user: User;
  natal: NatalChart | null;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const chart = await db
    .select()
    .from(natalCharts)
    .where(eq(natalCharts.userId, user.id))
    .limit(1);
  return { user, natal: chart[0] ?? null };
}
