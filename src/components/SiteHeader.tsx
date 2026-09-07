import Link from "next/link";
import BalancePill from "@/components/BalancePill";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getBalance } from "@/lib/wallet";

export const NAV = [
  { label: "Расклады", href: "/#readings" },
  { label: "Значения карт", href: "/cards" },
  { label: "Матрица судьбы", href: "/matrix" },
  { label: "AI-Таролог", href: "/#ai" },
];

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const balance = user ? await getBalance(user.id).catch(() => 0) : 0;
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--ink-900)]/80 border-b border-[var(--ink-600)]">
      <div className="mx-auto max-w-[1620px] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <svg
            viewBox="0 0 64 64"
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M32 6 L37.4 26.6 L58 32 L37.4 37.4 L32 58 L26.6 37.4 L6 32 L26.6 26.6 Z"
              fill="var(--gold)"
            />
            <path
              d="M32 19 L34.6 29.4 L45 32 L34.6 34.6 L32 45 L29.4 34.6 L19 32 L29.4 29.4 Z"
              fill="var(--ink-900)"
            />
          </svg>
          <span className="font-display text-lg tracking-[0.04em] text-[var(--gold-soft)]">
            Tarven<span className="text-[var(--gold)]">AI</span>
          </span>
          <span className="hidden sm:inline text-[11px] text-[var(--muted)] tracking-wide border-l border-[var(--ink-600)] pl-3 ml-0.5">
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
          {isAdmin(user) && (
            <Link
              href="/admin"
              className="hidden sm:inline text-sm text-[var(--rose)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Админка
            </Link>
          )}
          <BalancePill initial={balance} authed={!!user} />
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
