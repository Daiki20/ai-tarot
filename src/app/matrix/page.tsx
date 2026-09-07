import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MatrixClient from "@/components/MatrixClient";

export const metadata: Metadata = {
  title: "Матрица судьбы по дате рождения — рассчитать бесплатно",
  description:
    "Введите дату рождения и получите ключевые арканы вашей матрицы судьбы: портрет личности, внутренний ресурс, родовую программу и задачу жизни.",
};

export default function MatrixPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 w-full mx-auto max-w-[1620px] px-4 sm:px-6 py-12 sm:py-14">
        <p className="eyebrow mb-3">Бесплатно</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--bone)] mb-3">
          Матрица судьбы
        </h1>
        <p className="text-[var(--bone-dim)] max-w-xl mb-10 leading-relaxed">
          Дата рождения раскладывается на арканы Таро. Рассчитаем четыре ключевые
          энергии вашей матрицы — характер, ресурс, родовые задачи и
          предназначение.
        </p>
        <MatrixClient />
      </main>
      <SiteFooter />
    </>
  );
}
