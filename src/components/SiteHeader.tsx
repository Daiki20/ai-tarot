import Link from "next/link";
import AuraMark from "@/components/AuraMark";
import { getCurrentUser } from "@/lib/auth";

export const NAV = [
  { label: "Расклады", href: "/#readings" },
  { label: "Значения карт", href: "/cards" },
  { label: "Матрица судьбы", href: "/matrix" },
  { label: "AI-Таролог", href: "/#ai" },
];

export default async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--ink-900)]/80 border-b border-[var(--ink-600)]">
      <div className="mx-auto max-w-[1620px] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-baseline gap-3.5 shrink-0">
          <span className="font-display text-lg tracking-[0.22em] text-[var(--gold-soft)]">
            AI&nbsp;TAROT
          </span>
          <span className="hidden sm:inline text-[11px] text-[var(--muted)] tracking-wide border-l border-[var(--ink-600)] pl-3.5">
            карты знают ответ
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Баланс aura — сумма-заглушка до подключения оплаты */}
          <Link
            href="/profile"
            aria-label="Баланс aura"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--ink-600)] px-3 py-1.5 text-sm text-[var(--bone-dim)] hover:border-[var(--gold-deep)] hover:text-[var(--gold-soft)] transition-colors"
          >
            0
            <AuraMark className="inline-block w-[0.95em] h-[0.95em]" />
          </Link>
          {user ? (
            <Link
              href="/profile"
              className="hidden sm:inline text-sm text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Профиль
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline text-sm text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex btn-ghost rounded-full px-4 py-1.5 text-sm"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
