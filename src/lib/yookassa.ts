import "server-only";
import { randomUUID } from "node:crypto";

const API = "https://api.yookassa.ru/v3";

function creds(): { shopId: string; secretKey: string } | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  return { shopId, secretKey };
}

export function yookassaConfigured(): boolean {
  return creds() !== null;
}

function authHeader(): string {
  const c = creds()!;
  return "Basic " + Buffer.from(`${c.shopId}:${c.secretKey}`).toString("base64");
}

export interface YkPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
}

export async function createPayment(opts: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
  method?: string; // тип метода ЮKassa: sbp | bank_card | sberbank | tinkoff_bank
}): Promise<YkPayment> {
  const payload: Record<string, unknown> = {
    amount: { value: opts.amountRub.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: opts.returnUrl },
    description: opts.description,
    metadata: opts.metadata,
  };
  if (opts.method) {
    payload.payment_method_data = { type: opts.method };
  }
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Idempotence-Key": randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`yookassa create failed ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as YkPayment;
}

/** Перепроверить статус платежа своими ключами — не доверяем телу вебхука. */
export async function getPayment(id: string): Promise<YkPayment> {
  const res = await fetch(`${API}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`yookassa get failed ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as YkPayment;
}
