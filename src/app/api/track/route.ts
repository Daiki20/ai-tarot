import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyVisits } from "@/lib/db/schema";
import { mskDateStr } from "@/lib/time";

export const runtime = "nodejs";

// Маячок посещений. Клиент бьёт сюда один раз за сессию (sendBeacon).
// Считаем визиты по московским суткам.
export async function POST() {
  try {
    const day = mskDateStr();
    await db
      .insert(dailyVisits)
      .values({ day, count: 1 })
      .onConflictDoUpdate({
        target: dailyVisits.day,
        set: { count: sql`${dailyVisits.count} + 1` },
      });
  } catch {
    // счётчик посещений не критичен
  }
  return new Response(null, { status: 204 });
}
