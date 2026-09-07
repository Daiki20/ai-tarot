import { getOpenAI, OPENAI_READING_MODEL } from "@/lib/openai";
import { getSpreadById } from "@/data/spreads";
import { getCardById } from "@/data/cards";
import { buildReadingMessages, parseReadingLine } from "@/lib/reading";
import { getNatalContext } from "@/lib/natal/context";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { readings } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    spreadId?: unknown;
    question?: unknown;
    cards?: unknown;
    readingKey?: unknown;
  } | null;

  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const spread =
    typeof body.spreadId === "string" ? getSpreadById(body.spreadId) : undefined;
  if (!spread) {
    return Response.json({ error: "unknown spread" }, { status: 400 });
  }

  if (!Array.isArray(body.cards) || body.cards.length !== spread.cardCount) {
    return Response.json({ error: "cards count mismatch" }, { status: 400 });
  }

  const cards = body.cards.map((c) => {
    const rec = (c ?? {}) as Record<string, unknown>;
    return { cardId: String(rec.cardId), reversed: Boolean(rec.reversed) };
  });
  if (cards.some((c) => !getCardById(c.cardId))) {
    return Response.json({ error: "unknown card" }, { status: 400 });
  }

  const question =
    typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  const readingKey =
    typeof body.readingKey === "string" ? body.readingKey.slice(0, 64) : null;

  // Натальный фон и пользователь — из сессии, не из тела запроса.
  const [natalCtx, user] = await Promise.all([getNatalContext(), getCurrentUser()]);

  const positionCount = spread.positions.length;
  const encoder = new TextEncoder();

  // Стримим разбор построчным NDJSON: {type:"card",index,text} на карту,
  // затем {type:"summary"|"advice"}, в конце {type:"done"} или {type:"error"}.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Копим результат, чтобы сохранить в историю после стрима.
      const cardTexts: Record<number, string> = {};
      let summary = "";
      let advice = "";

      try {
        const completion = await getOpenAI().chat.completions.create({
          model: OPENAI_READING_MODEL,
          messages: buildReadingMessages({
            spread,
            question,
            cards,
            natal: natalCtx?.summary,
          }),
          temperature: 0.8,
          max_tokens: 1600,
          stream: true,
        });

        let buffer = "";
        let sawAny = false;
        const seenCards = new Set<number>();

        const flushLine = (line: string) => {
          const evt = parseReadingLine(line);
          if (!evt) return;
          if (evt.type === "card") {
            if (evt.index < 0 || evt.index >= positionCount) return;
            if (seenCards.has(evt.index)) return;
            seenCards.add(evt.index);
            cardTexts[evt.index] = evt.text;
          } else if (evt.type === "summary") {
            summary = evt.text;
          } else if (evt.type === "advice") {
            advice = evt.text;
          }
          sawAny = true;
          send(evt);
        };

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;
          buffer += delta;
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            flushLine(buffer.slice(0, nl));
            buffer = buffer.slice(nl + 1);
          }
        }
        flushLine(buffer);

        send(sawAny ? { type: "done" } : { type: "error" });

        // История раскладов — привязана к пользователю и его натальной карте.
        if (user && sawAny) {
          try {
            await db.insert(readings).values({
              userId: user.id,
              natalChartId: natalCtx?.natalChartId ?? null,
              kind: "spread",
              spreadId: spread.id,
              readingKey,
              question: question || null,
              cardCount: spread.cardCount,
              cards,
              result: {
                cards: spread.positions.map((pos, i) => ({
                  label: pos.label,
                  ...cards[i],
                  text: cardTexts[i] ?? null,
                })),
                summary,
                advice,
              },
            });
          } catch (e) {
            console.error("[api/reading] history save failed:", e);
          }
        }
      } catch (err) {
        console.error("[api/reading] generation failed:", err);
        try {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "error" }) + "\n"),
          );
        } catch {
          // поток уже закрыт — ничего не делаем
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
