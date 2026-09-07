import { openai, OPENAI_CHAT_MODEL } from "@/lib/openai";
import { buildChatMessages, type ChatMessage } from "@/lib/chat";
import type { ReadingResult } from "@/lib/reading";
import { getNatalContext } from "@/lib/natal/context";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    spreadName?: unknown;
    question?: unknown;
    reading?: unknown;
    messages?: unknown;
    kind?: unknown;
  } | null;

  if (!body) {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const reading = body.reading as ReadingResult | undefined;
  if (
    !reading ||
    !Array.isArray(reading.cards) ||
    typeof reading.summary !== "string"
  ) {
    return Response.json({ error: "missing reading context" }, { status: 400 });
  }

  const history: ChatMessage[] = (
    Array.isArray(body.messages) ? body.messages : []
  )
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json(
      { error: "expected trailing user message" },
      { status: 400 },
    );
  }
  if (history.length > 40) history.splice(0, history.length - 40);

  const natalCtx = await getNatalContext();

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: buildChatMessages({
        spreadName:
          typeof body.spreadName === "string"
            ? body.spreadName.slice(0, 80)
            : "расклад",
        question:
          typeof body.question === "string" ? body.question.slice(0, 500) : "",
        reading,
        history,
        kind: body.kind === "matrix" ? "matrix" : "reading",
        natal: natalCtx?.summary,
      }),
      temperature: 0.8,
      max_tokens: 550,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      return Response.json({ error: "empty reply" }, { status: 502 });
    }
    return Response.json({ reply });
  } catch (err) {
    console.error("[api/chat] generation failed:", err);
    return Response.json({ error: "generation failed" }, { status: 502 });
  }
}
