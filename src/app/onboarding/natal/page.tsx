import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NatalForm from "@/components/NatalForm";
import { getCurrentUserWithNatal } from "@/lib/auth";

export const metadata: Metadata = { title: "Натальная карта — TarvenAI" };

// Обязательный шаг: без натальной карты аккаунт не считается готовым.
export default async function NatalOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextUrl = typeof next === "string" ? next : null;

  const ctx = await getCurrentUserWithNatal();
  if (!ctx) redirect("/register");
  if (ctx.natal) redirect(nextUrl ?? "/profile");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-12 sm:py-16">
        <NatalForm
          defaultName={ctx.user.email.split("@")[0]}
          next={nextUrl ?? undefined}
        />
      </main>
      <SiteFooter />
    </>
  );
}
