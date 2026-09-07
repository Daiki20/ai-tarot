"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadingResult } from "@/lib/reading";
import type { ChatMessage } from "@/lib/chat";
import Spinner from "@/components/Spinner";

export default function ChatPanel({
  spreadName,
  question,
  reading,
  kind = "reading",
}: {
  spreadName: string;
  question: string;
  reading: ReadingResult;
  kind?: "reading" | "matrix";
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spreadName, question, reading, messages: next, kind }),
      });
      const data = (await r.json().catch(() => null)) as { reply?: string } | null;
      const reply =
        r.ok && data && typeof data.reply === "string"
          ? data.reply
          : "Не получилось ответить. Попробуйте переспросить.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Связь прервалась. Попробуйте ещё раз." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--ink-600)]">
        <p className="eyebrow">Диалог с AI-тарологом</p>
      </div>

      <div className="px-5 py-4 space-y-3 max-h-[440px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {kind === "matrix"
              ? "Спросите про свою матрицу — например, «Как раскрыть зону таланта?» или «Что за задача у моей линии любви?»."
              : "Спросите про этот расклад — например, «А что мне делать с работой?» или «Почему так складывается с отношениями?»."}
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "rounded-tr-sm border border-[var(--ink-600)] text-[var(--bone)]"
                  : "rounded-tl-sm bg-[var(--ink-700)] text-[var(--bone-dim)]"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg rounded-tl-sm bg-[var(--ink-700)] px-4 py-2.5 text-sm text-[var(--muted)]">
              <Spinner size={14} className="text-[var(--gold)]" />
              AI-таролог печатает…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-4 py-3 border-t border-[var(--ink-600)] flex gap-2 items-end">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Спросите AI-таролога…"
          className="flex-1 resize-none rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)] max-h-32"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          aria-label="Отправить"
          className="btn-gold grid h-10 w-10 shrink-0 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .69.71 1.18 1.39.91z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
