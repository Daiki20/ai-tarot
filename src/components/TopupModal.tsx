"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import TopupPanel from "@/components/TopupPanel";

// Рендерится только по клику (клиент), поэтому document всегда доступен.
// Портал в body — иначе backdrop-blur на <header> становится containing block
// для position:fixed и модалку зажимает в шапке.
export default function TopupModal({ onClose }: { onClose: () => void }) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Пополнение баланса"
        className="relative w-full max-w-lg rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6 sm:p-7 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="font-display text-xl text-[var(--gold-soft)]">
            Пополнение баланса
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--ink-700)] hover:text-[var(--bone)]"
          >
            ✕
          </button>
        </div>
        <TopupPanel />
      </div>
    </div>,
    document.body,
  );
}
