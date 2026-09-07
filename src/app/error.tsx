"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center">
      <p className="eyebrow mb-4">Что-то пошло не так</p>
      <h1 className="font-display text-3xl sm:text-4xl text-[var(--gold-soft)]">
        Ошибка на странице
      </h1>
      <p className="mt-4 max-w-sm text-sm text-[var(--bone-dim)] leading-relaxed">
        Попробуйте обновить — если не помогает, вернитесь на главную.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="btn-gold rounded-full px-7 py-3 text-sm"
        >
          Обновить
        </button>
        <Link href="/" className="btn-ghost rounded-full px-6 py-3 text-sm">
          На главную
        </Link>
      </div>
    </main>
  );
}
