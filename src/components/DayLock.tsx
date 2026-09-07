"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function fmt(ms: number): string {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

// Карта дня уже вытянута сегодня — показываем обратный отсчёт до 00:00 МСК.
export default function DayLock({ nextAt }: { nextAt: string }) {
  const target = new Date(nextAt).getTime();
  const [left, setLeft] = useState(() => target - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = target - Date.now();
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="mx-auto max-w-md text-center rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-8">
      <p className="eyebrow mb-3">Карта дня</p>
      <h2 className="font-display text-2xl text-[var(--gold-soft)]">
        На сегодня уже вытянута
      </h2>
      <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed">
        Новая карта откроется после полуночи по Москве.
      </p>
      <p className="mt-5 font-display text-3xl tracking-wider text-[var(--bone)] tabular-nums">
        {fmt(left)}
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/#readings"
          className="btn-gold rounded-full px-6 py-2.5 text-sm"
        >
          Выбрать расклад
        </Link>
        <Link
          href="/profile"
          className="btn-ghost rounded-full px-6 py-2.5 text-sm"
        >
          Мои расклады
        </Link>
      </div>
    </div>
  );
}
