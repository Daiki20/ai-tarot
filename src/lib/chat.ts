import type { ReadingResult } from "./reading";
import { natalSystemBlock } from "@/lib/natal/prompt";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CLIP = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export function buildChatMessages(params: {
  spreadName: string;
  question: string;
  reading: ReadingResult;
  history: ChatMessage[];
  kind?: "reading" | "matrix";
  natal?: string | null;
}) {
  const { spreadName, question, reading, history, kind = "reading", natal } = params;

  const isMatrix = kind === "matrix";

  const cardsBlock = reading.cards
    .map(
      (c) =>
        `• ${c.label}: ${c.name}${c.reversed ? " (перевёрнутая)" : ""} — ${CLIP(
          c.text,
          400,
        )}`,
    )
    .join("\n");

  const intro = isMatrix
    ? `Ты только что составил для человека полный разбор «Матрица судьбы»${
        question ? ` (${question})` : ""
      }.

Позиции матрицы и твоё толкование:
${cardsBlock}

Портрет по матрице: ${CLIP(reading.summary, 800)}
Совет: ${CLIP(reading.advice, 400)}

Теперь человек задаёт уточняющие вопросы по своей матрице. Отвечай коротко и по делу
(2–5 предложений), опираясь на рассчитанные позиции и своё толкование. Новых раскладов
не делаешь и ничего не выдумываешь. Отвечаешь на вопрос человека, а не пересказываешь
общие значения арканов.`
    : `Ты только что сделал для человека расклад «${spreadName}».
Его вопрос был: «${question || "не задан"}».

Карты расклада и твоё толкование:
${cardsBlock}

Общая картина: ${CLIP(reading.summary, 800)}
Совет: ${CLIP(reading.advice, 400)}

Теперь человек задаёт уточняющие вопросы по этому раскладу. Отвечай коротко и по делу
(2–5 предложений), опираясь на уже вытянутые карты и своё толкование. Новые карты не тянешь
и не придумываешь. Если для ответа явно нужен отдельный расклад — мягко предложи сделать
его отдельно. Отвечаешь на вопрос человека, а не пересказываешь общие значения карт.`;

  const system = `Ты — AI-таролог сервиса AI TAROT. Пишешь по-русски, обращение на «вы».
Тон: тёплый, спокойный, точный. Без эзотерического жаргона, без гарантий и обещаний,
без запугивания. Не выдумываешь конкретные события, имена и даты.

${intro}`;

  const natalBlock = natalSystemBlock(natal);
  return [
    { role: "system" as const, content: system },
    ...(natalBlock ? [{ role: "system" as const, content: natalBlock }] : []),
    ...history
      .slice(-12)
      .map((m) => ({ role: m.role, content: CLIP(m.content, 2000) })),
  ];
}
