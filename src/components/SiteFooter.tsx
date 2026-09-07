import Link from "next/link";
import { NAV } from "./SiteHeader";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--ink-600)]">
      <div className="mx-auto max-w-[1620px] px-4 sm:px-6 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="font-display tracking-[0.22em] text-[var(--gold-soft)]">
            AI&nbsp;TAROT
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] max-w-sm leading-relaxed">
            18+ · Сервис создан для развлечения и саморефлексии и не заменяет
            консультацию специалиста.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
