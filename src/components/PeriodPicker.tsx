"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PRESETS = [
  { id: "today", label: "Сегодня" },
  { id: "yesterday", label: "Вчера" },
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "all", label: "Всё время" },
];

export default function PeriodPicker() {
  const router = useRouter();
  const sp = useSearchParams();
  const custom = !!sp.get("from") && !!sp.get("to");
  const current = custom ? "custom" : sp.get("period") ?? "today";

  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [open, setOpen] = useState(custom);

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs border transition-colors ${
      active
        ? "border-[var(--gold)] text-[var(--gold-soft)]"
        : "border-[var(--ink-600)] text-[var(--muted)] hover:border-[var(--gold-deep)]"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => router.push(`/admin?period=${p.id}`)}
          className={chip(current === p.id)}
        >
          {p.label}
        </button>
      ))}
      <button onClick={() => setOpen((v) => !v)} className={chip(current === "custom")}>
        Свой период
      </button>
      {open && (
        <span className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-2 py-1 text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
          <span className="text-xs text-[var(--muted)]">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-2 py-1 text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
          <button
            onClick={() => from && to && router.push(`/admin?from=${from}&to=${to}`)}
            disabled={!from || !to}
            className="btn-gold rounded-full px-3 py-1 text-xs disabled:opacity-40"
          >
            OK
          </button>
        </span>
      )}
    </div>
  );
}
