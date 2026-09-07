"use client";

import { useEffect, useState } from "react";
import AuraMark from "@/components/AuraMark";
import Spinner from "@/components/Spinner";
import {
  TOPUP_PACKS,
  PAY_METHODS,
  packDiscountPct,
  type PayMethodId,
} from "@/lib/pricing";

function MethodIcon({ id }: { id: PayMethodId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (id === "sbp")
    return (
      <svg {...common}>
        <path d="M12 3v18M5 7l7 5-7 5M19 7l-7 5 7 5" />
      </svg>
    );
  if (id === "bank_card")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  if (id === "sberbank")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-6" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

// Внутренняя часть модалки пополнения. Используется и в отдельном попапе (TopupModal),
// и во вью «не хватает монет» внутри PayModal.
export default function TopupPanel({
  balance: balanceProp,
  needAura,
}: {
  balance?: number;
  needAura?: number; // при покупке: сколько aura не хватает — подсветим подходящий пак
}) {
  const [balance, setBalance] = useState<number | null>(balanceProp ?? null);

  const defaultAura = (() => {
    if (needAura && needAura > 0) {
      const fit = TOPUP_PACKS.find((p) => p.aura >= needAura);
      return (fit ?? TOPUP_PACKS[TOPUP_PACKS.length - 1]).aura;
    }
    return 1200;
  })();

  const [aura, setAura] = useState<number>(defaultAura);
  const [method, setMethod] = useState<PayMethodId>("sbp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (balanceProp !== undefined) return;
    fetch("/api/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.balance === "number") setBalance(d.balance);
      })
      .catch(() => {});
  }, [balanceProp]);

  const pack = TOPUP_PACKS.find((p) => p.aura === aura) ?? TOPUP_PACKS[0];

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aura: pack.aura, method }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (res.ok && data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data?.error ?? "Не удалось открыть оплату. Попробуйте позже.");
    } catch {
      setError("Нет связи с сервером. Попробуйте позже.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Текущий баланс */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--ink-600)] bg-[var(--ink-900)] px-4 py-3">
        <span className="text-sm text-[var(--muted)]">Текущий баланс</span>
        <span className="inline-flex items-center gap-1.5 font-display text-lg text-[var(--bone)]">
          <AuraMark className="inline-block w-[0.8em] h-[0.8em] text-[var(--gold)]" />
          {(balance ?? 0).toLocaleString("ru-RU")}
        </span>
      </div>

      {/* Паки */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {TOPUP_PACKS.map((p) => {
          const disc = packDiscountPct(p);
          const selected = p.aura === aura;
          return (
            <button
              key={p.aura}
              type="button"
              onClick={() => setAura(p.aura)}
              className={`relative rounded-xl border p-3 text-center transition-colors ${
                selected
                  ? "border-[var(--gold)] bg-[rgba(201,163,95,0.07)]"
                  : "border-[var(--ink-600)] bg-[var(--ink-900)] hover:border-[var(--gold-deep)]"
              }`}
            >
              {disc > 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-semibold text-[#1a1408]">
                  −{disc}%
                </span>
              )}
              <span className="mt-1 flex items-center justify-center gap-1.5 font-display text-lg text-[var(--bone)]">
                <AuraMark className="inline-block w-[0.75em] h-[0.75em] text-[var(--gold)]" />
                {p.aura.toLocaleString("ru-RU")}
              </span>
              <span className="block text-[11px] text-[var(--muted)]">aura</span>
              <span className="mt-1.5 block text-sm text-[var(--bone-dim)]">
                {p.price.toLocaleString("ru-RU")} ₽
                {disc > 0 && (
                  <span className="ml-1.5 text-xs text-[var(--muted)] line-through">
                    {p.aura.toLocaleString("ru-RU")} ₽
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Способ оплаты */}
      <p className="eyebrow mt-5 mb-2">Способ оплаты</p>
      <div className="grid grid-cols-2 gap-2.5">
        {PAY_METHODS.map((m) => {
          const selected = m.id === method;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                selected
                  ? "border-[var(--gold)] text-[var(--gold-soft)]"
                  : "border-[var(--ink-600)] text-[var(--bone-dim)] hover:border-[var(--gold-deep)]"
              }`}
            >
              <span className={selected ? "text-[var(--gold)]" : "text-[var(--muted)]"}>
                <MethodIcon id={m.id} />
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--rose)" }}>
          {error}
        </p>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="btn-gold mt-4 w-full rounded-full px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy && <Spinner size={15} />}
        Оплатить {pack.price.toLocaleString("ru-RU")} ₽
      </button>

      <p className="mt-3 text-center text-xs text-[var(--muted)] leading-relaxed">
        Aura — внутренняя единица сервиса: ею оплачиваются расклады. Это не ставка
        и не вывод средств.
      </p>
    </div>
  );
}
