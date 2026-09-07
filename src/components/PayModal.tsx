"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Price from "@/components/Price";
import Spinner from "@/components/Spinner";
import TopupPanel from "@/components/TopupPanel";
import { type PayPurpose } from "@/lib/pricing";

export default function PayModal({
  heading = "Оплата расклада",
  title,
  subtitle,
  price,
  purpose,
  onPay,
  onCancel,
}: {
  heading?: string;
  title: string;
  subtitle?: string;
  price: number;
  purpose: PayPurpose;
  onPay: () => void;
  onCancel: () => void;
}) {
  const [view, setView] = useState<"confirm" | "topup" | "auth">("confirm");
  const [balance, setBalance] = useState<number | null>(null);
  const [need, setNeed] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fetch("/api/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.balance === "number") setBalance(d.balance);
      })
      .catch(() => {});
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(purpose),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; balance?: number; need?: number; error?: string }
        | null;

      if (res.status === 401) {
        setView("auth");
        return;
      }
      if (res.status === 402) {
        if (typeof data?.balance === "number") setBalance(data.balance);
        if (typeof data?.need === "number") setNeed(data.need);
        setView("topup");
        return;
      }
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Не удалось списать. Попробуйте ещё раз.");
        return;
      }
      window.dispatchEvent(
        new CustomEvent("aura:refresh", {
          detail: typeof data.balance === "number" ? { balance: data.balance } : undefined,
        }),
      );
      onPay();
    } catch {
      setError("Нет связи с сервером. Попробуйте позже.");
    } finally {
      setBusy(false);
    }
  }

  const next =
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/";

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
            {view === "topup"
              ? "Пополнить баланс"
              : view === "auth"
                ? "Нужен аккаунт"
                : heading}
          </h3>
          <button
            onClick={onCancel}
            aria-label="Закрыть"
            className="-mr-1.5 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--ink-700)] hover:text-[var(--bone)]"
          >
            ✕
          </button>
        </div>

        {view === "confirm" && (
          <>
            <div className="mt-5 rounded-xl border border-[var(--ink-600)] bg-[var(--ink-900)] p-4">
              <p className="font-display text-lg text-[var(--bone)]">{title}</p>
              {subtitle && (
                <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--ink-600)] bg-[var(--ink-900)] px-4 py-3.5">
              <span className="text-sm text-[var(--muted)]">Стоимость</span>
              <Price
                amount={price}
                className="font-display text-xl text-[var(--gold-soft)]"
                markClassName="inline-block w-[0.75em] h-[0.75em]"
              />
            </div>

            {balance !== null && (
              <p className="mt-2 text-xs text-[var(--muted)] text-right">
                На балансе:{" "}
                <Price
                  amount={balance}
                  className="text-[var(--bone-dim)]"
                  markClassName="inline-block w-[0.8em] h-[0.8em]"
                />
              </p>
            )}

            {error && (
              <p className="mt-3 text-sm" style={{ color: "var(--rose)" }}>
                {error}
              </p>
            )}

            <button
              onClick={pay}
              disabled={busy}
              className="btn-gold mt-4 w-full rounded-full px-6 py-3.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Spinner size={15} />}
              Списать с баланса · <Price amount={price} />
            </button>
            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              Спишется с баланса aura · без подписки
            </p>
          </>
        )}

        {view === "topup" && (
          <>
            <p className="mt-1 mb-4 text-sm text-[var(--bone-dim)] leading-relaxed">
              На балансе{" "}
              <Price
                amount={balance ?? 0}
                className="text-[var(--gold-soft)]"
                markClassName="inline-block w-[0.8em] h-[0.8em]"
              />
              , а нужно{" "}
              <Price
                amount={price}
                className="text-[var(--gold-soft)]"
                markClassName="inline-block w-[0.8em] h-[0.8em]"
              />
              . Пополните баланс.
            </p>

            <TopupPanel balance={balance ?? 0} needAura={need} />

            <button
              onClick={() => {
                setView("confirm");
                setError(null);
              }}
              className="btn-ghost mt-3 w-full rounded-full px-6 py-2.5 text-sm"
            >
              Назад
            </button>
          </>
        )}

        {view === "auth" && (
          <>
            <p className="mt-4 text-sm text-[var(--bone-dim)] leading-relaxed">
              Оплата и расклады доступны из аккаунта. Войдите или
              зарегистрируйтесь — мы вернём вас сюда.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="btn-gold rounded-full px-6 py-3 text-sm text-center"
              >
                Зарегистрироваться
              </Link>
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="btn-ghost rounded-full px-6 py-3 text-sm text-center"
              >
                У меня уже есть аккаунт
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
