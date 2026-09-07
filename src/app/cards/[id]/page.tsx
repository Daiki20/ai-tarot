import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CARDS, getCardById } from "@/data/cards";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export function generateStaticParams() {
  return CARDS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const card = getCardById(id);
  if (!card) return {};
  return {
    title: `${card.name} — значение карты Таро`,
    description: `Карта Таро «${card.name}»: значение в прямом и перевёрнутом положении. Ключевые слова: ${card.keywords.join(", ")}.`,
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getCardById(id);
  if (!card) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-14">
        <Link
          href="/cards"
          className="text-sm text-[var(--muted)] hover:text-[var(--gold-soft)] transition-colors"
        >
          ← Все карты
        </Link>

        <div className="mt-8 grid sm:grid-cols-[260px_1fr] gap-10">
          <div className="rounded-xl border border-[var(--gold-deep)] bg-[#efe7d6] p-3 h-fit">
            <Image
              src={card.image}
              alt={card.name}
              width={260}
              height={457}
              priority
              className="block"
            />
          </div>

          <div>
            <h1 className="font-display text-4xl text-[var(--bone)]">
              {card.name}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {card.keywords.map((k) => (
                <span
                  key={k}
                  className="text-xs uppercase tracking-wide border border-[var(--ink-600)] rounded-full px-3 py-1 text-[var(--muted)]"
                >
                  {k}
                </span>
              ))}
            </div>

            <h2 className="eyebrow mt-8 mb-2">Прямое положение</h2>
            <p className="text-[var(--bone-dim)] leading-relaxed">
              {card.upright}
            </p>

            <h2 className="eyebrow mt-6 mb-2">Перевёрнутое положение</h2>
            <p className="text-[var(--bone-dim)] leading-relaxed">
              {card.reversed}
            </p>

            <div className="mt-10 rounded-lg border border-[var(--ink-600)] bg-[var(--ink-800)] p-5">
              <p className="text-sm text-[var(--bone-dim)]">
                Хотите узнать, что эта карта значит именно в вашей ситуации?
              </p>
              <Link
                href="/#readings"
                className="btn-gold rounded-full px-6 py-2.5 text-sm inline-block mt-4"
              >
                Сделать расклад
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
