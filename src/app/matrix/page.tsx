import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MatrixClient from "@/components/MatrixClient";
import { getCurrentUserWithNatal } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Матрица судьбы по дате рождения",
  description:
    "Ключевые арканы вашей матрицы судьбы: портрет личности, внутренний ресурс, родовая программа и задача жизни.",
};

export default async function MatrixPage() {
  const ctx = await getCurrentUserWithNatal();
  if (!ctx) redirect("/login?next=/matrix");
  if (!ctx.natal) redirect("/onboarding/natal?next=/matrix");

  const birthDate = ctx.natal.birthDate;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-12 sm:py-14">
        <p className="eyebrow mb-3">По вашей дате рождения</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--bone)] mb-3">
          Матрица судьбы
        </h1>
        <p className="text-[var(--bone-dim)] max-w-xl mb-10 leading-relaxed">
          Дата рождения из вашей натальной карты раскладывается на арканы Таро.
          Четыре ключевые энергии матрицы — характер, ресурс, родовые задачи и
          предназначение.
        </p>
        <MatrixClient birthDate={birthDate} />
      </main>
      <SiteFooter />
    </>
  );
}
