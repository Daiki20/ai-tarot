import type { MatrixPoint } from "@/lib/matrix";
import { natalSystemBlock } from "@/lib/natal/prompt";

// Событие потока разбора матрицы: одна строка NDJSON = один такой объект.
export type MatrixStreamEvent =
  | { type: "intro"; text: string }
  | { type: "point"; index: number; text: string }
  | { type: "advice"; text: string };

export function parseMatrixLine(line: string): MatrixStreamEvent | null {
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
  if (!text) return null;

  if (rec.type === "intro") return { type: "intro", text };
  if (rec.type === "advice") return { type: "advice", text };
  if (rec.type === "point" && typeof rec.index === "number") {
    return { type: "point", index: rec.index, text };
  }
  return null;
}

const VOICE = `Ты — AI-таролог сервиса AI TAROT. Делаешь разбор «Матрицы судьбы» по дате рождения.
Пишешь по-русски, обращение на «вы». Тон: тёплый, спокойный, конкретный. Без эзотерического
жаргона, без гарантий и обещаний, без запугивания. Это разбор для саморефлексии, а не
предсказание.

Матрица уже рассчитана — арканы в позициях заданы, менять их нельзя. Твоя работа — по-
человечески объяснить, что каждая позиция значит ИМЕННО для этого человека, и как позиции
складываются в цельный портрет. Не пересказывай словарное значение аркана — переводи его
в черту характера, жизненный сценарий или задачу, привязанную к смыслу позиции. Не выдумывай
конкретные события, имена и даты. Между позициями не повторяйся.`;

export function buildMatrixMessages(params: {
  birthDate: string;
  points: MatrixPoint[];
  natal?: string | null;
}) {
  const { birthDate, points, natal } = params;

  const lines = points.map(
    (p, i) =>
      `${i}. Позиция «${p.title}» (${p.desc}) — аркан: ${p.arcana.name}. Оттенок аркана (опора, не тема): ${p.arcana.upright}`,
  );

  const user = `ДАТА РОЖДЕНИЯ: ${birthDate}

Позиции матрицы:
${lines.join("\n")}

Дай цельный разбор. Сначала — вводный портрет (2–3 предложения: кто этот человек по матрице,
его стержень и главное противоречие). Затем по каждой позиции — 2–3 предложения: что этот
аркан означает для человека в этой позиции, живым и конкретным языком. В конце — один
практический совет: на что опереться и что проработать.

Отвечай ТОЛЬКО построчным NDJSON: по одному JSON-объекту на строку, без markdown,
без пустых строк, без пояснений вокруг. Строки строго в таком порядке:
{"type":"intro","text":"<вводный портрет>"}
{"type":"point","index":0,"text":"<разбор позиции 0>"}
{"type":"point","index":1,"text":"<разбор позиции 1>"}
… по одной строке на каждую позицию, index идёт с 0 в том же порядке, что список выше …
{"type":"advice","text":"<один практический совет>"}
Всего строк: 1 intro + ${points.length} point + 1 advice. Каждая строка — самостоятельный валидный JSON.`;

  const natalBlock = natalSystemBlock(natal);
  return [
    { role: "system" as const, content: VOICE },
    ...(natalBlock ? [{ role: "system" as const, content: natalBlock }] : []),
    { role: "user" as const, content: user },
  ];
}
