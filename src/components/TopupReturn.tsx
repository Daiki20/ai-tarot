"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Возврат со страницы оплаты ЮKassa (?topup=done). Дёргаем сверку платежей,
// обновляем шапку и страницу. Показываем короткое уведомление о зачислении.
export default function TopupReturn() {
  const params = useSearchParams();
  const router = useRouter();
  const done = useRef(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("topup") !== "done" || done.current) return;
    done.current = true;
    fetch("/api/payments/reconcile", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.balance === "number") {
          window.dispatchEvent(
            new CustomEvent("aura:refresh", { detail: { balance: d.balance } }),
          );
          if (d.credited > 0) {
            setMsg(`Зачислено ${Number(d.credited).toLocaleString("ru-RU")} aura`);
          }
          router.refresh();
        }
      })
      .catch(() => {});
  }, [params, router]);

  if (!msg) return null;
  return (
    <div className="mb-4 rounded-xl border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.08)] px-4 py-3 text-sm text-[var(--gold-soft)]">
      {msg}
    </div>
  );
}
