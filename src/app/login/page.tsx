import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthForm from "@/components/AuthForm";
import { getCurrentUserWithNatal } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход — AI Tarot" };

export default async function LoginPage() {
  const ctx = await getCurrentUserWithNatal();
  if (ctx) redirect(ctx.natal ? "/profile" : "/onboarding/natal");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-14 sm:py-20">
        <AuthForm mode="login" />
      </main>
      <SiteFooter />
    </>
  );
}
