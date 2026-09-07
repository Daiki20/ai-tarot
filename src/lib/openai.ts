import OpenAI from "openai";

// Только для server-side (route handlers). Ключ никогда не попадает на клиент.
// Клиент создаётся лениво: при импорте модуля (в т.ч. на этапе `next build`,
// когда ключа ещё нет) конструктор OpenAI бросил бы «Missing credentials».
let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

// Базовая модель — фолбэк для всех вызовов.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Разбор расклада — это товар, поэтому по умолчанию модель помощнее.
export const OPENAI_READING_MODEL =
  process.env.OPENAI_READING_MODEL || OPENAI_MODEL;

// Диалог с AI-тарологом — частый и болтливый, дешёвой модели достаточно.
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || OPENAI_MODEL;
