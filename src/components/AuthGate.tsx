"use client";

import { useEffect } from "react";
import Link from "next/link";

// Попап-заслонка: гостю нельзя открыть расклад/матрицу. Не форма входа —
// только уведомление с переходом на /login или /register (туда прокидываем
// ?next=, чтобы после авторизации вернуть человека к тому, что он нажал).
export default function AuthGate({
  next,
  onClose,
}: {
  next: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const q = `?next=${encodeURIComponent(next)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Нужен аккаунт"
        className="relative w-full max-w-md rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6 sm:p-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--ink-700)] hover:text-[var(--bone)]"
        >
          ✕
        </button>

        <h3 className="font-display text-xl text-[var(--gold-soft)]">
          Нужен аккаунт
        </h3>
        <p className="mt-2 text-sm text-[var(--bone-dim)] leading-relaxed">
          Чтобы сделать расклад, войдите или зарегистрируйтесь. После входа мы
          вернём вас к тому, что вы выбрали.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/register${q}`}
            className="btn-gold rounded-full px-6 py-3 text-sm"
          >
            Зарегистрироваться
          </Link>
          <Link
            href={`/login${q}`}
            className="btn-ghost rounded-full px-6 py-3 text-sm"
          >
            У меня уже есть аккаунт
          </Link>
        </div>
      </div>
    </div>
  );
}
