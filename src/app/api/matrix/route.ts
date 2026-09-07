import { getOpenAI, OPENAI_READING_MODEL } from "@/lib/openai";
import { computeFullMatrix } from "@/lib/matrix";
import { buildMatrixMessages, parseMatrixLine } from "@/lib/matrix-reading";
import { getNatalContext } from "@/lib/natal/context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    birthDate?: unknown;
  } | null;

  if (!body || typeof body.birthDate !== "string") {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const birthDate = body.birthDate;
  const points = computeFullMatrix(birthDate);
  if (!points) {
    return Response.json({ error: "bad date" }, { status: 400 });
  }

  const natalCtx = await getNatalContext();
  const pointCount = points.length;
  const encoder = new TextEncoder();

  // Стримим разбор построчным NDJSON: intro, затем point по индексам, затем advice,
  // в конце {type:"done"} или {type:"error"}.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        const completion = await getOpenAI().chat.completions.create({
          model: OPENAI_READING_MODEL,
          messages: buildMatrixMessages({ birthDate, points, natal: natalCtx?.summary }),
          temperature: 0.8,
          max_tokens: 1800,
          stream: true,
        });

        let buffer = "";
        let sawAny = false;
        const seenPoints = new Set<number>();

        const flushLine = (line: string) => {
          const evt = parseMatrixLine(line);
          if (!evt) return;
          if (evt.type === "point") {
            if (evt.index < 0 || evt.index >= pointCount) return;
            if (seenPoints.has(evt.index)) return;
            seenPoints.add(evt.index);
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
      } catch (err) {
        console.error("[api/matrix] generation failed:", err);
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
