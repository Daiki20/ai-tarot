"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import AuraMark from "@/components/AuraMark";
import { REGISTER_BONUS } from "@/lib/pricing";

// Форма входа/регистрации. Намеренно простая — авторизацию будут переделывать.
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Куда вернуть человека после авторизации (то, что он нажал до попапа).
  const next = searchParams.get("next");
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; next?: string; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Что-то пошло не так. Попробуйте ещё раз.");
        setLoading(false);
        return;
      }
      if (isRegister) {
        // После регистрации — обязательный онбординг натальной карты,
        // а уже он вернёт человека на исходное действие.
        router.push(`/onboarding/natal${nextQuery}`);
      } else {
        router.push(next ?? data.next ?? "/profile");
      }
      router.refresh();
    } catch {
      setError("Нет связи с сервером. Попробуйте позже.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {isRegister && (
        <div
          className="mb-6 flex items-center gap-3.5 rounded-xl border border-[var(--gold-deep)] p-4"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(201,163,95,0.1), rgba(201,163,95,0.02) 55%, transparent 78%)",
            boxShadow: "inset 0 1px 0 rgba(227,200,143,0.14)",
          }}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--gold-deep)] bg-[rgba(201,163,95,0.06)] text-[var(--gold)]">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
              <path
                d="M32 5 L37.6 26.4 L59 32 L37.6 37.6 L32 59 L26.4 37.6 L5 32 L26.4 26.4 Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--gold)]">
              Бонус новым
            </span>
            <span className="mt-0.5 inline-flex items-center gap-1 font-display text-xl text-[var(--gold-soft)]">
              {REGISTER_BONUS}
              <AuraMark className="inline-block h-[0.7em] w-[0.7em] text-[var(--gold)]" />
              aura
            </span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              начислим на счёт сразу после создания аккаунта
            </span>
          </span>
        </div>
      )}
      <h1 className="font-display text-2xl sm:text-3xl text-[var(--gold-soft)]">
        {isRegister ? "Регистрация" : "Вход"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        {isRegister
          ? "Аккаунт нужен, чтобы сохранить натальную карту и историю раскладов."
          : "Войдите, чтобы вернуться к своим раскладам."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label htmlFor="email" className="eyebrow block mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2.5 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="eyebrow block mb-1.5">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2.5 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
          {isRegister && (
            <p className="mt-1 text-xs text-[var(--muted)]">Не короче 8 символов.</p>
          )}
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--rose)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Spinner size={15} />}
          {isRegister ? `Создать аккаунт · +${REGISTER_BONUS} aura` : "Войти"}
        </button>
      </form>

      <p className="mt-5 text-sm text-[var(--muted)]">
        {isRegister ? (
          <>
            Уже есть аккаунт?{" "}
            <Link
              href={`/login${nextQuery}`}
              className="text-[var(--gold-soft)] hover:underline"
            >
              Войти
            </Link>
          </>
        ) : (
          <>
            Нет аккаунта?{" "}
            <Link
              href={`/register${nextQuery}`}
              className="text-[var(--gold-soft)] hover:underline"
            >
              Зарегистрироваться
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
