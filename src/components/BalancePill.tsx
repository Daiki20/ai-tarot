"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuraMark from "@/components/AuraMark";
import TopupModal from "@/components/TopupModal";

// Живой баланс aura в шапке. Клик у авторизованного открывает пополнение.
export default function BalancePill({
  initial,
  authed,
}: {
  initial: number;
  authed: boolean;
}) {
  const [balance, setBalance] = useState(initial);
  const [topup, setTopup] = useState(false);

  useEffect(() => {
    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail as { balance?: number } | undefined;
      if (detail && typeof detail.balance === "number") {
        setBalance(detail.balance);
        return;
      }
      fetch("/api/balance")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && typeof d.balance === "number") setBalance(d.balance);
        })
        .catch(() => {});
    };
    window.addEventListener("aura:refresh", refresh);
    return () => window.removeEventListener("aura:refresh", refresh);
  }, []);

  const cls =
    "inline-flex items-center gap-1 rounded-full border border-[var(--ink-600)] px-3 py-1.5 text-sm text-[var(--bone-dim)] hover:border-[var(--gold-deep)] hover:text-[var(--gold-soft)] transition-colors";
  const inner = (
    <>
      {balance.toLocaleString("ru-RU")}
      <AuraMark className="inline-block w-[0.95em] h-[0.95em]" />
    </>
  );

  if (!authed) {
    return (
      <Link href="/register" aria-label="Баланс" className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setTopup(true)}
        aria-label={`Баланс: ${balance} aura — пополнить`}
        className={cls}
      >
        {inner}
      </button>
      {topup && <TopupModal onClose={() => setTopup(false)} />}
    </>
  );
}
