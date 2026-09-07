import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthForm from "@/components/AuthForm";
import { getCurrentUserWithNatal } from "@/lib/auth";

export const metadata: Metadata = { title: "Регистрация — TarvenAI" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextUrl = typeof next === "string" ? next : null;
  const nextQuery = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : "";

  const ctx = await getCurrentUserWithNatal();
  if (ctx) {
    if (!ctx.natal) redirect(`/onboarding/natal${nextQuery}`);
    redirect(nextUrl ?? "/profile");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
