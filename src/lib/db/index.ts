/**
 * Подключение к Postgres через Drizzle.
 *
 * Строка подключения — DATABASE_URL (см. .env.example). Локально это Postgres из
 * docker-compose.yml. Пул переиспользуется между hot-reload'ами в dev.
 *
 * Использование:
 *   import { db } from "@/lib/db";
 *   import { users } from "@/lib/db/schema";
 *   const rows = await db.select().from(users);
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://taro:taro@localhost:5432/taro";

// Облачный Postgres (Neon/Supabase/Railway) требует SSL; локальный docker — нет.
// Включаем SSL, если хост не локальный или в строке есть sslmode.
function needsSsl(url: string): boolean {
  try {
    const u = new URL(url);
    if (/sslmode=(require|prefer|verify)/.test(u.search)) return true;
    return !["localhost", "127.0.0.1", "::1", ""].includes(u.hostname);
  } catch {
    return false;
  }
}

const globalForDb = globalThis as unknown as {
  __taroPgPool?: Pool;
};

const pool =
  globalForDb.__taroPgPool ??
  new Pool({
    connectionString,
    max: 10,
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__taroPgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
