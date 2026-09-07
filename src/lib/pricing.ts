import { getReadingById } from "@/data/readings";

// Единственный источник цен на стороне сервера. Клиент присылает только «за что»,
// сумму берём отсюда — сколько aura списать.
export const CHAT_ADDON_PRICE = 49;
export const MATRIX_FULL_PRICE = 390;
export const DAY_DEEP_PRICE = 99;

export type PayPurpose =
  | { kind: "reading"; readingKey: string }
  | { kind: "chat-addon" }
  | { kind: "matrix-full" }
  | { kind: "day-deep" };

/** Цена в aura для покупки, либо null если запрос некорректен. */
export function priceFor(p: PayPurpose): { amount: number; ref: string } | null {
  switch (p.kind) {
    case "reading": {
      const r = getReadingById(p.readingKey);
      if (!r) return null;
      return { amount: r.price, ref: `reading:${r.id}` };
    }
    case "chat-addon":
      return { amount: CHAT_ADDON_PRICE, ref: "chat-addon" };
    case "matrix-full":
      return { amount: MATRIX_FULL_PRICE, ref: "matrix-full" };
    case "day-deep":
      return { amount: DAY_DEEP_PRICE, ref: "day-deep" };
    default:
      return null;
  }
}

// Паки пополнения: за `price` ₽ на баланс зачисляется `aura` aura.
// Скидка (aura > price) — с 600 монет, максимум 20%.
export const TOPUP_PACKS = [
  { aura: 100, price: 100 },
  { aura: 300, price: 300 },
  { aura: 600, price: 540 },
  { aura: 1200, price: 1020 },
  { aura: 2500, price: 2000 },
  { aura: 5000, price: 4000 },
] as const;

export type TopupPack = (typeof TOPUP_PACKS)[number];

export function topupPack(aura: number): TopupPack | null {
  return TOPUP_PACKS.find((p) => p.aura === aura) ?? null;
}

export function packDiscountPct(p: TopupPack): number {
  return Math.round((1 - p.price / p.aura) * 100);
}

// Способы оплаты в модалке -> тип метода в API ЮKassa.
export const PAY_METHODS = [
  { id: "sbp", label: "СБП" },
  { id: "bank_card", label: "Карта" },
  { id: "sberbank", label: "Сбер Пей" },
  { id: "tinkoff_bank", label: "Т-Пей" },
] as const;

export type PayMethodId = (typeof PAY_METHODS)[number]["id"];

export function isPayMethod(v: unknown): v is PayMethodId {
  return PAY_METHODS.some((m) => m.id === v);
}
