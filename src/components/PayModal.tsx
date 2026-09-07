"use client";

import { useEffect } from "react";
import Price from "@/components/Price";

export default function PayModal({
  heading = "Оплата расклада",
  title,
  subtitle,
  price,
  onPay,
  onCancel,
}: {
  heading?: string;
  title: string;
  subtitle?: string;
  price: number;
  onPay: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="relative w-full max-w-md rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl text-[var(--gold-soft)]">
            {heading}
          </h3>
          <button
            onClick={onCancel}
            aria-label="Закрыть"
            className="-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--ink-700)] hover:text-[var(--bone)]"
          >
            ✕
          </button>
        </div>

        {/* Что оплачивается */}
        <div className="mt-5 rounded-xl border border-[var(--ink-600)] bg-[var(--ink-900)] p-4">
          <p className="font-display text-lg text-[var(--bone)]">{title}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
          )}
        </div>

        {/* Стоимость */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--ink-600)] bg-[var(--ink-900)] px-4 py-3.5">
          <span className="text-sm text-[var(--muted)]">Стоимость</span>
          <Price
            amount={price}
            className="font-display text-xl text-[var(--gold-soft)]"
            markClassName="inline-block w-[0.75em] h-[0.75em]"
          />
        </div>

        <button
          onClick={onPay}
          className="btn-gold mt-5 w-full rounded-full px-6 py-3.5 text-sm inline-flex items-center justify-center gap-1.5"
        >
          Списать с баланса · <Price amount={price} />
        </button>

        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Спишется с баланса aura · без подписки
        </p>
      </div>
    </div>
  );
}
