import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center">
        <p className="eyebrow mb-4">Страница не найдена</p>
        <h1 className="font-display text-4xl sm:text-5xl text-[var(--gold-soft)]">
          404
        </h1>
        <p className="mt-4 max-w-sm text-sm text-[var(--bone-dim)] leading-relaxed">
          Такой страницы нет — возможно, ссылка устарела. Вернитесь на главную и
          выберите расклад.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold rounded-full px-7 py-3 text-sm">
            На главную
          </Link>
          <Link
            href="/#readings"
            className="btn-ghost rounded-full px-6 py-3 text-sm"
          >
            Расклады
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
