"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUserRow({
  email,
  role,
  balance,
  toppedUp,
  createdAt,
  isFounder,
}: {
  email: string;
  role: string;
  balance: number;
  toppedUp: number;
  createdAt: string;
  isFounder: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<null | "grant" | "role">(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bal, setBal] = useState(balance);
  const [curRole, setCurRole] = useState(role);

  async function grant() {
    const n = parseInt(amount, 10);
    if (!Number.isInteger(n) || n <= 0) {
      setMsg("Введите число > 0");
      return;
    }
    setBusy("grant");
    setMsg(null);
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, amount: n }),
      });
      const d = (await res.json().catch(() => null)) as
        | { ok?: boolean; balance?: number; error?: string }
        | null;
      if (res.ok && d?.ok) {
        setBal(d.balance ?? bal + n);
        setAmount("");
        setMsg(`+${n} aura`);
        router.refresh();
      } else {
        setMsg(d?.error ?? "Ошибка");
      }
    } catch {
      setMsg("Нет связи");
    } finally {
      setBusy(null);
    }
  }

  async function toggleRole() {
    const next = curRole === "admin" ? "user" : "admin";
    setBusy("role");
    setMsg(null);
    try {
      const res = await fetch("/api/admin/role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role: next }),
      });
      const d = (await res.json().catch(() => null)) as
        | { ok?: boolean; role?: string; error?: string }
        | null;
      if (res.ok && d?.ok) {
        setCurRole(d.role ?? next);
        setMsg(next === "admin" ? "выдана админка" : "админка снята");
        router.refresh();
      } else {
        setMsg(d?.error ?? "Ошибка");
      }
    } catch {
      setMsg("Нет связи");
    } finally {
      setBusy(null);
    }
  }

  return (
    <tr className="border-b border-[var(--ink-600)] last:border-0 align-top">
      <td className="px-4 py-3 text-[var(--bone-dim)]">{email}</td>
      <td className="px-4 py-3 text-[var(--gold-soft)]">{bal.toLocaleString("ru-RU")}</td>
      <td className="px-4 py-3 text-[var(--muted)]">
        {toppedUp > 0 ? `${toppedUp.toLocaleString("ru-RU")} ₽` : "—"}
      </td>
      <td className="px-4 py-3">
        {curRole === "admin" ? (
          <span className="rounded-full border border-[var(--gold-deep)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--gold-soft)]">
            admin
          </span>
        ) : (
          <span className="text-[var(--muted)]">user</span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--muted)]">
        {new Date(createdAt).toLocaleDateString("ru-RU")}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="aura"
            inputMode="numeric"
            className="w-20 rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-2 py-1.5 text-xs text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
          <button
            onClick={grant}
            disabled={busy !== null}
            className="btn-gold rounded-full px-3 py-1.5 text-xs disabled:opacity-40"
          >
            {busy === "grant" ? "…" : "Выдать"}
          </button>
          {!isFounder && (
            <button
              onClick={toggleRole}
              disabled={busy !== null}
              className="btn-ghost rounded-full px-3 py-1.5 text-xs disabled:opacity-40"
            >
              {busy === "role"
                ? "…"
                : curRole === "admin"
                  ? "Снять админку"
                  : "Сделать админом"}
            </button>
          )}
          {msg && <span className="text-xs text-[var(--gold-soft)]">{msg}</span>}
        </div>
      </td>
    </tr>
  );
}
