import { getOpenAI, OPENAI_READING_MODEL } from "@/lib/openai";
import { getCardById } from "@/data/cards";
import { buildDayMessages, parseDayLine } from "@/lib/day-reading";
import { getNatalContext } from "@/lib/natal/context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    cardId?: unknown;
    reversed?: unknown;
  } | null;

  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const card =
    typeof body.cardId === "string" ? getCardById(body.cardId) : undefined;
  if (!card) {
    return Response.json({ error: "unknown card" }, { status: 400 });
  }
  const reversed = Boolean(body.reversed);
  const natalCtx = await getNatalContext();

  const encoder = new TextEncoder();

  // Стримим разбор дня построчным NDJSON: {type:"section",key,text},
  // в конце {type:"done"} или {type:"error"}.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const completion = await getOpenAI().chat.completions.create({
          model: OPENAI_READING_MODEL,
          messages: buildDayMessages({ card, reversed, natal: natalCtx?.summary }),
          temperature: 0.85,
          max_tokens: 900,
          stream: true,
        });

        let buffer = "";
        let sawAny = false;
        const seenKeys = new Set<string>();

        const flushLine = (line: string) => {
          const evt = parseDayLine(line);
          if (!evt) return;
          if (seenKeys.has(evt.key)) return;
          seenKeys.add(evt.key);
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
      } catch (err) {
        console.error("[api/day] generation failed:", err);
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
