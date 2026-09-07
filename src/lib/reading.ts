import type { Spread } from "@/data/spreads";
import { getCardById } from "@/data/cards";
import { natalSystemBlock } from "@/lib/natal/prompt";

export interface DrawnCardInput {
  cardId: string;
  reversed: boolean;
}

export interface ReadingCardResult {
  label: string;
  name: string;
  reversed: boolean;
  text: string;
}

export interface ReadingResult {
  cards: ReadingCardResult[];
  summary: string;
  advice: string;
}

// Событие потока разбора: одна строка NDJSON = один такой объект.
export type ReadingStreamEvent =
  | { type: "card"; index: number; text: string }
  | { type: "summary"; text: string }
  | { type: "advice"; text: string };

// Разбирает одну строку NDJSON от модели в типизированное событие.
// Возвращает null для мусора, markdown-заборов и незавершённых строк.
export function parseReadingLine(line: string): ReadingStreamEvent | null {
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

  if (rec.type === "card" && typeof rec.index === "number") {
    return { type: "card", index: rec.index, text };
  }
  if (rec.type === "summary") return { type: "summary", text };
  if (rec.type === "advice") return { type: "advice", text };
  return null;
}

const VOICE = `Ты — AI-таролог сервиса TarvenAI. Пишешь по-русски, обращение на «вы».
Тон: тёплый, спокойный, точный. Без эзотерического жаргона, без гарантий и обещаний,
без восторженных восклицаний. Не запугиваешь.

ГЛАВНОЕ — ТЕМА ВОПРОСА. Ты отвечаешь на конкретный вопрос человека, а не пересказываешь
значение карт. Сначала определи тему вопроса (отношения с конкретным человеком / бывший
партнёр / чувства другого / работа и карьера / деньги / переезд / здоровье / общее
направление жизни и т.п.) — и ВЕСЬ разбор держи строго в этой теме. Запрещено менять или
подмешивать другую сферу: если спрашивают про отношения — ни слова про работу и деньги;
если про работу — ни слова про личную жизнь, кроме случаев, когда человек прямо назвал
несколько сфер. Каждое предложение должно быть узнаваемо про вопрос: упоминай его тему
и действующих лиц своими словами. Если указан срок или период — учитывай его.

Базовые значения карт даны только как опора и оттенок. Не переписывай их и не позволяй
им увести тебя с темы: карту всегда истолковывай применительно к вопросу и её позиции.
Если вопрос про будущее или период — говори о тенденциях и на что обратить внимание,
а не о «характере» карты.

Формат: сжато, 1–2 предложения на карту, без воды и повторов. Не начинай с названия карты
и позиции — читатель их видит. Не выдумывай конкретные события, имена и точные даты.
Это интерпретация для саморефлексии, а не предсказание.`;

export function buildReadingMessages(params: {
  spread: Pick<Spread, "name" | "positions">;
  question: string;
  cards: DrawnCardInput[];
  natal?: string | null;
}) {
  const { spread, question, cards, natal } = params;
  const q = question || "вопрос не задан — дай общий разбор ситуации";

  const lines = spread.positions.map((pos, i) => {
    const d = cards[i];
    const c = d ? getCardById(d.cardId) : null;
    if (!c || !d) return `${i + 1}. «${pos.label}» — карта не вытянута`;
    const base = d.reversed ? c.reversed : c.upright;
    return `${i + 1}. Позиция «${pos.label}» (что показывает: ${pos.hint}). Карта: ${
      c.name
    }${d.reversed ? ", перевёрнутая" : ""}. Оттенок карты (опора, не тема): ${base}`;
  });

  const user = `ВОПРОС ЧЕЛОВЕКА (это и есть тема всего разбора): «${q}»
Расклад: «${spread.name}».

Карты по позициям:
${lines.join("\n")}

Сначала про себя определи тему вопроса и держи в ней весь разбор — не переходи на другие
сферы жизни. Для каждой карты скажи, что она говорит ПРО ЭТОТ вопрос в контексте своей
позиции (позиция важнее, чем словарное значение карты). В summary первым предложением —
прямой ответ на вопрос человека, затем короткое пояснение. В advice — один конкретный
совет по его ситуации. Каждая строка должна быть узнаваемо про «${q}».

Отвечай ТОЛЬКО построчным NDJSON: по одному JSON-объекту на строку, без markdown,
без пустых строк, без пояснений вокруг. Строки строго в таком порядке:
{"type":"card","index":0,"text":"<1–2 предложения по вопросу для позиции 1>"}
{"type":"card","index":1,"text":"<для позиции 2>"}
… по одной строке на каждую карту, index идёт с 0 в том же порядке, что список выше …
{"type":"summary","text":"<2–3 предложения: прямой ответ на вопрос + пояснение>"}
{"type":"advice","text":"<1 предложение: конкретный совет>"}
Всего строк: ${cards.length} карт + summary + advice. Каждая строка — самостоятельный валидный JSON.`;

  const natalBlock = natalSystemBlock(natal);
  return [
    { role: "system" as const, content: VOICE },
    ...(natalBlock ? [{ role: "system" as const, content: natalBlock }] : []),
    { role: "user" as const, content: user },
  ];
}
