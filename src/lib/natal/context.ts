/**
 * Натальный контекст для AI-таролога. Берётся ИЗ СЕССИИ на сервере (не из тела
 * запроса), чтобы клиент не мог его подменить. Все AI-роуты (reading, chat, matrix,
 * day) зовут эту функцию и передают строку в build*Messages.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { natalCharts } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function getNatalContext(): Promise<{
  natalChartId: string;
  summary: string;
} | null> {
  // Натальный фон — best-effort: если БД недоступна или пользователь гость,
  // расклад всё равно должен считаться, просто без этого блока.
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const row = await db
      .select({ id: natalCharts.id, summary: natalCharts.summary })
      .from(natalCharts)
      .where(eq(natalCharts.userId, user.id))
      .limit(1);

    const chart = row[0];
    if (!chart) return null;
    return { natalChartId: chart.id, summary: chart.summary };
  } catch (err) {
    console.error("[natal/context] lookup failed:", err);
    return null;
  }
}
