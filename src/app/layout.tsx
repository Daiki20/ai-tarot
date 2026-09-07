import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import MobileNav from "@/components/MobileNav";
import VisitBeacon from "@/components/VisitBeacon";

// Дисплейный сериф с высоким контрастом — «editorial», а не сток-мистик.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

// Тихий гротеск для тела.
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "TarvenAI · Лучший ИИ-таролог онлайн",
  description:
    "TarvenAI — лучший ИИ-таролог онлайн. Задайте вопрос обычными словами: ИИ выберет расклад, откроет карты и объяснит их простым языком.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] lg:pb-0">
        {children}
        <MobileNav />
        <VisitBeacon />
      </body>
    </html>
  );
}
