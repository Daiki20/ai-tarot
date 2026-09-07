import type { TarotCard } from "@/data/cards";
import { natalSystemBlock } from "@/lib/natal/prompt";

export const DAY_SECTIONS = [
  { key: "tone", title: "Настрой дня" },
  { key: "morning", title: "Утро" },
  { key: "afternoon", title: "День" },
  { key: "evening", title: "Вечер" },
  { key: "support", title: "Что поддержит" },
  { key: "avoid", title: "Чего избегать" },
  { key: "phrase", title: "Фраза дня" },
] as const;

export type DaySectionKey = (typeof DAY_SECTIONS)[number]["key"];

export type DayStreamEvent = {
  type: "section";
  key: DaySectionKey;
  text: string;
};

const KEYS = new Set<string>(DAY_SECTIONS.map((s) => s.key));

export function parseDayLine(line: string): DayStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("```")) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;

  const rec = obj as Record<string, unknown>;
  const text = typeof rec.text === "string" ? rec.text.trim() : "";
  if (
    rec.type === "section" &&
    typeof rec.key === "string" &&
    KEYS.has(rec.key) &&
    text
  ) {
    return { type: "section", key: rec.key as DaySectionKey, text };
  }
  return null;
}

const VOICE = `Ты — AI-таролог сервиса AI TAROT. Пишешь по-русски, обращение на «вы».
Тон: тёплый, спокойный, конкретный, дружеский. Без эзотерического жаргона, без гарантий
и обещаний, без запугивания. Это подсказка для саморефлексии, а не предсказание.

Тебе дана одна карта дня. Разбери по ней СЕГОДНЯШНИЙ день — практично и приземлённо:
про настроение, общение, дела, решения в течение одного дня. Не рассуждай о судьбе, годе
или больших жизненных циклах. Словарное значение карты — только опора, переводи его в
конкретные бытовые подсказки на день. Не выдумывай события, встречи, имена и числа.
Между блоками не повторяйся.`;

export function buildDayMessages(params: {
  card: TarotCard;
  reversed: boolean;
  natal?: string | null;
}) {
  const { card, reversed, natal } = params;
  const base = reversed ? card.reversed : card.upright;

  const user = `КАРТА ДНЯ: ${card.name}${reversed ? ", перевёрнутая" : ""}.
Оттенок карты (опора, не тема): ${base}
Ключевые слова: ${card.keywords.join(", ")}

Дай практичный разбор одного сегодняшнего дня по этой карте.

Отвечай ТОЛЬКО построчным NDJSON: по одному JSON-объекту на строку, без markdown,
без пустых строк, без пояснений вокруг. Строки строго в таком порядке:
{"type":"section","key":"tone","text":"<общий настрой и энергия дня, 2 предложения>"}
{"type":"section","key":"morning","text":"<на что настроиться утром, 1–2 предложения>"}
{"type":"section","key":"afternoon","text":"<фокус дневной части дня, 1–2 предложения>"}
{"type":"section","key":"evening","text":"<чем хорошо завершить вечер, 1–2 предложения>"}
{"type":"section","key":"support","text":"<что сегодня поддержит и на что опереться>"}
{"type":"section","key":"avoid","text":"<чего сегодня лучше избегать>"}
{"type":"section","key":"phrase","text":"<короткая фраза-опора на день, 3–7 слов>"}
Только эти 7 строк, каждая — самостоятельный валидный JSON.`;

  const natalBlock = natalSystemBlock(natal);
  return [
    { role: "system" as const, content: VOICE },
    ...(natalBlock ? [{ role: "system" as const, content: natalBlock }] : []),
    { role: "user" as const, content: user },
  ];
}
