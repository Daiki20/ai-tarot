"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TABS = [
  {
    href: "/",
    label: "Главная",
    match: (p: string) => p === "/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5 9.5V20h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/matrix",
    label: "Матрица",
    match: (p: string) => p.startsWith("/matrix"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </svg>
    ),
  },
  {
    href: "/#readings",
    label: "Спросить",
    center: true,
    match: () => false,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...ICON}>
        <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" />
        <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
      </svg>
    ),
  },
  {
    href: "/cards",
    label: "Карты",
    match: (p: string) => p.startsWith("/cards"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
        <rect x="4" y="4" width="11" height="16" rx="1.5" transform="rotate(-8 9.5 12)" />
        <rect x="9" y="4" width="11" height="16" rx="1.5" transform="rotate(8 14.5 12)" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Профиль",
    match: (p: string) => p.startsWith("/profile"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5.5 19.5c1.2-3.4 4-5 6.5-5s5.3 1.6 6.5 5" />
      </svg>
    ),
  },
];

// Экранная клавиатура на телефоне сжимает видимую область, и то, что было над
// нижним меню, может оказаться под ним. Простое и надёжное решение — прятать меню,
// пока где-то на странице есть фокус в поле ввода (клавиатура открыта).
function isTextInput(el: EventTarget | null): boolean {
  return (
    el instanceof HTMLElement &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  );
}

export default function MobileNav() {
  const pathname = usePathname() || "/";
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isTextInput(e.target)) setKeyboardOpen(true);
    };
    const onFocusOut = () => {
      // фокус мог просто перескочить в другое поле — проверяем с небольшой задержкой
      window.setTimeout(() => {
        if (!isTextInput(document.activeElement)) setKeyboardOpen(false);
      }, 50);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Админка — свой интерфейс, потребительское меню там не нужно.
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Навигация"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ink-600)] bg-[var(--ink-900)]/95 backdrop-blur-md transition-transform duration-200 lg:hidden ${
        keyboardOpen ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid w-full max-w-md grid-cols-5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          if (t.center) {
            return (
              <li key={t.href} className="flex justify-center">
                <Link
                  href={t.href}
                  aria-label={t.label}
                  className="btn-gold -mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_25px_-8px_rgba(201,163,95,0.6)]"
                >
                  {t.icon}
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors ${
                  active
                    ? "text-[var(--gold-soft)]"
                    : "text-[var(--muted)] hover:text-[var(--bone-dim)]"
                }`}
              >
                {t.icon}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
