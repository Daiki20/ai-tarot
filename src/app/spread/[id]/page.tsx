import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpreadById, SPREADS } from "@/data/spreads";
import { getReadingById } from "@/data/readings";
import SiteHeader from "@/components/SiteHeader";
import SpreadClient from "./SpreadClient";

export function generateStaticParams() {
  return SPREADS.map((s) => ({ id: s.id }));
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
  const paywall = reading
    ? { title: reading.title, price: reading.price }
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
        <SpreadClient
          spread={spread}
          paywall={paywall}
          questionExample={questionExample}
        />
      </div>
      </main>
    </>
  );
}
