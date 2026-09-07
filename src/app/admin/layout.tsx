import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export const metadata = { title: "Админка — TarvenAI" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();
  if (!isAdmin(me)) notFound();

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-[var(--ink-600)] bg-[var(--ink-900)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-display text-[var(--gold-soft)] tracking-[0.04em] shrink-0">
            Tarven<span className="text-[var(--gold)]">AI</span>
            <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--rose)]">
              админка
            </span>
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin"
              className="text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Дашборд
            </Link>
            <Link
              href="/admin/users"
              className="text-[var(--bone-dim)] hover:text-[var(--gold-soft)] transition-colors"
            >
              Пользователи
            </Link>
          </nav>
          <Link
            href="/"
            className="ml-auto text-xs text-[var(--muted)] hover:text-[var(--gold-soft)] transition-colors whitespace-nowrap"
          >
            На сайт ↗
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full mx-auto max-w-[1200px] px-4 sm:px-6 py-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
