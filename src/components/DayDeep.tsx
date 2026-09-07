"use client";

import { useEffect, useRef, useState } from "react";
import { getCardById } from "@/data/cards";
import { DAY_SECTIONS, type DaySectionKey } from "@/lib/day-reading";
import type { ReadingResult } from "@/lib/reading";
import PayModal from "@/components/PayModal";
import Spinner from "@/components/Spinner";
import ChatPanel from "@/components/ChatPanel";
import Price from "@/components/Price";
import { DAY_DEEP_PRICE } from "@/lib/pricing";

const PRICE = DAY_DEEP_PRICE;

export default function DayDeep({
  cardId,
  reversed,
}: {
  cardId: string;
  reversed: boolean;
}) {
  const card = getCardById(cardId);

  const [showPay, setShowPay] = useState(false);
  const [paid, setPaid] = useState(false);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const fetchStarted = useRef(false);

  const loading = paid && !done && !error;
  const read = Object.keys(sections).length;

  const dayReading: ReadingResult | null =
    done && card
      ? {
          cards: [
            {
              label: "Карта дня",
              name: card.name,
              reversed,
              text:
                sections.tone ?? (reversed ? card.reversed : card.upright),
            },
          ],
          summary: sections.tone ?? "",
          advice: sections.phrase ?? "",
        }
      : null;

  useEffect(() => {
    if (!paid || fetchStarted.current) return;
    fetchStarted.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/day", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cardId, reversed }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("http");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let sawError = false;

        const handle = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          let evt: { type?: string; key?: unknown; text?: unknown };
          try {
            evt = JSON.parse(trimmed);
          } catch {
            return;
          }
          if (
            evt.type === "section" &&
            typeof evt.key === "string" &&
            typeof evt.text === "string"
          ) {
            const key = evt.key;
            const txt = evt.text;
            setSections((prev) => (prev[key] ? prev : { ...prev, [key]: txt }));
          } else if (evt.type === "error") {
            sawError = true;
          }
        };

        for (;;) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            handle(buf.slice(0, nl));
            buf = buf.slice(nl + 1);
          }
        }
        handle(buf);

        if (sawError) setError(true);
        setDone(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(true);
        setDone(true);
      }
    })();

    return () => controller.abort();
  }, [paid, cardId, reversed]);

  if (!card) return null;

  const morning = ["morning", "afternoon", "evening"] as DaySectionKey[];
  const both = ["support", "avoid"] as DaySectionKey[];

  return (
    <div className="mt-6">
      {!paid ? (
        <div className="rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-7 text-center">
          <p className="eyebrow mb-2">Ещё по этой карте</p>
          <h3 className="font-display text-xl text-[var(--gold-soft)]">
            День подробно
          </h3>
          <p className="mt-2 text-sm text-[var(--bone-dim)] max-w-lg mx-auto leading-relaxed">
            Разбор по вашей карте на утро, день и вечер, что сегодня поддержит и
            чего избегать, короткая фраза-опора и разговор с AI-тарологом о вашем
            дне.
          </p>
          <button
            onClick={() => setShowPay(true)}
            className="btn-gold mt-6 inline-flex items-center gap-1.5 rounded-full px-8 py-3 text-sm"
          >
            Открыть · <Price amount={PRICE} />
          </button>
        </div>
      ) : (
        <div>
          <h3
            className="font-display text-2xl text-center"
            style={{ color: "var(--gold-soft)" }}
          >
            День подробно
          </h3>
          {loading && (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
              <Spinner size={14} className="text-[var(--gold)]" />
              AI-таролог расписывает день…
              {read > 0 && ` ${read} / ${DAY_SECTIONS.length}`}
            </p>
          )}
          {error && read === 0 && (
            <p className="mt-1 text-center text-sm text-[var(--muted)]">
              Не удалось получить разбор дня. Попробуйте позже.
            </p>
          )}

          {sections.tone ? (
            <div
              className="mt-5 rounded-xl border p-6 sm:p-7 fade-in"
              style={{
                borderColor: "var(--gold-deep)",
                background: "rgba(201,163,95,0.06)",
                boxShadow: "inset 0 1px 0 rgba(227,200,143,0.12)",
              }}
            >
              <p className="eyebrow text-center mb-3">Настрой дня</p>
              <p className="text-[15px] leading-relaxed text-[var(--bone)]">
                {sections.tone}
              </p>
            </div>
          ) : (
            loading && (
              <div className="mt-5 flex justify-center py-4 text-[var(--gold)]">
                <Spinner size={20} />
              </div>
            )
          )}

          <div className="mt-4 grid sm:grid-cols-3 gap-px bg-[var(--ink-600)] border border-[var(--ink-600)] rounded-xl overflow-hidden">
            {morning.map((k) => {
              const title = DAY_SECTIONS.find((s) => s.key === k)!.title;
              const text = sections[k];
              return (
                <div key={k} className="bg-[var(--ink-800)] p-5">
                  <p className="eyebrow mb-2">{title}</p>
                  {text ? (
                    <p className="text-[13px] leading-snug text-[var(--bone-dim)] fade-in">
                      {text}
                    </p>
                  ) : loading ? (
                    <div className="flex py-1 text-[var(--gold)]">
                      <Spinner size={16} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-px bg-[var(--ink-600)] border border-[var(--ink-600)] rounded-xl overflow-hidden">
            {both.map((k) => {
              const title = DAY_SECTIONS.find((s) => s.key === k)!.title;
              const text = sections[k];
              const isAvoid = k === "avoid";
              return (
                <div key={k} className="bg-[var(--ink-800)] p-5">
                  <p
                    className="eyebrow mb-2"
                    style={isAvoid ? { color: "var(--rose)" } : undefined}
                  >
                    {title}
                  </p>
                  {text ? (
                    <p className="text-[13px] leading-snug text-[var(--bone-dim)] fade-in">
                      {text}
                    </p>
                  ) : loading ? (
                    <div className="flex py-1 text-[var(--gold)]">
                      <Spinner size={16} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {sections.phrase && (
            <p
              className="mt-5 text-center font-display italic text-lg fade-in"
              style={{ color: "var(--gold-soft)" }}
            >
              «{sections.phrase}»
            </p>
          )}

          {dayReading && (
            <div className="mt-4">
              <ChatPanel
                spreadName="Карта дня"
                question=""
                reading={dayReading}
              />
            </div>
          )}
        </div>
      )}

      {showPay && (
        <PayModal
          heading="Карта дня"
          title="День подробно"
          subtitle="Утро, день и вечер · поддержка и предостережение · чат с AI-тарологом"
          price={PRICE}
          purpose={{ kind: "day-deep" }}
          onPay={() => {
            setPaid(true);
            setShowPay(false);
          }}
          onCancel={() => setShowPay(false)}
        />
      )}
    </div>
  );
}
