import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CARDS } from "@/data/cards";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Значения карт Таро — полный справочник",
  description:
    "Значения всех 78 карт Таро Райдера-Уэйта: прямое и перевёрнутое положение, ключевые слова. Старшие и Младшие арканы.",
};

const GROUPS = [
  { suit: "major", title: "Старшие арканы" },
  { suit: "wands", title: "Жезлы" },
  { suit: "cups", title: "Кубки" },
  { suit: "swords", title: "Мечи" },
  { suit: "pentacles", title: "Пентакли" },
] as const;

export default function CardsIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-12 sm:py-14">
        <p className="eyebrow mb-3">Справочник</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--bone)] mb-3">
          Значения карт Таро
        </h1>
        <p className="text-[var(--bone-dim)] max-w-xl mb-12 leading-relaxed">
          Все 78 карт колоды Райдера-Уэйта — с толкованием в прямом и
          перевёрнутом положении.
        </p>

        {GROUPS.map((g) => {
          const cards = CARDS.filter((c) => c.suit === g.suit);
          return (
            <section key={g.suit} className="mb-14">
              <h2 className="font-display text-2xl text-[var(--gold-soft)] mb-6">
                {g.title}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {cards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cards/${c.id}`}
                    className="lift group rounded-lg border border-[var(--ink-600)] bg-[var(--ink-800)] hover:bg-[var(--ink-700)] p-3"
                  >
                    <div className="rounded-md overflow-hidden border border-[var(--gold-deep)] bg-[#efe7d6] p-1.5 mb-2.5">
                      <Image
                        src={c.image}
                        alt={c.name}
                        width={200}
                        height={351}
                        className="block"
                      />
                    </div>
                    <p className="text-sm text-center text-[var(--bone-dim)] group-hover:text-[var(--gold-soft)] transition-colors">
                      {c.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <SiteFooter />
    </>
  );
}
