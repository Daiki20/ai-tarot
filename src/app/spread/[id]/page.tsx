import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { getSpreadById, SPREADS } from "@/data/spreads";
import { getReadingById } from "@/data/readings";
import { getCurrentUserWithNatal } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { readings } from "@/lib/db/schema";
import { mskDayStart, nextMskDayStart } from "@/lib/time";
import SiteHeader from "@/components/SiteHeader";
import DayLock from "@/components/DayLock";
import SpreadClient from "./SpreadClient";

export function generateStaticParams() {
  return SPREADS.map((s) => ({ id: s.id }));
}

// «Карта дня» открыта гостю; всё остальное — только после входа.
// Залогиненному «Карта дня» доступна раз в сутки (сброс в 00:00 МСК).
async function drewDayCardToday(userId: string): Promise<boolean> {
  try {
    const row = await db
      .select({ id: readings.id })
      .from(readings)
      .where(
        and(
          eq(readings.userId, userId),
          eq(readings.spreadId, "day"),
          gte(readings.createdAt, mskDayStart()),
        ),
      )
      .limit(1);
    return row.length > 0;
  } catch {
    return false; // БД недоступна — не блокируем
  }
}

export default async function SpreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const spread = getSpreadById(id);

  if (!spread) {
    notFound();
  }

  const { r } = await searchParams;
  const reading = typeof r === "string" ? getReadingById(r) : undefined;
  const selfUrl = `/spread/${id}${typeof r === "string" ? `?r=${r}` : ""}`;

  const ctx = await getCurrentUserWithNatal();
  const isDay = id === "day";

  if (!isDay && !ctx) {
    redirect(`/login?next=${encodeURIComponent(selfUrl)}`);
  }

  const dayLocked =
    isDay && ctx && !isAdmin(ctx.user)
      ? await drewDayCardToday(ctx.user.id)
      : false;

  const paywall = reading
    ? {
        title: reading.title,
        price: reading.price,
        chat: !!reading.chat,
        readingKey: reading.id,
      }
    : null;
  const questionExample =
    reading?.example ??
    spread.questionExample ??
    "Опишите свою ситуацию или задайте вопрос";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col px-4 sm:px-8 py-4 sm:py-5">
      <div className="max-w-[1620px] w-full mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Link href="/#readings" className="text-sm text-[var(--muted)] hover:text-[var(--gold-soft)] transition-colors">
            ← Все расклады
          </Link>
        </div>
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="font-display text-2xl sm:text-3xl mb-1" style={{ color: "var(--gold-soft)" }}>
            {spread.name}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl mx-auto">{spread.description}</p>
        </div>
        {dayLocked ? (
          <DayLock nextAt={nextMskDayStart().toISOString()} />
        ) : (
          <SpreadClient
            spread={spread}
            paywall={paywall}
            questionExample={questionExample}
          />
        )}
      </div>
      </main>
    </>
  );
}
