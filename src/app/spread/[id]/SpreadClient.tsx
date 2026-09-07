"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CARDS, getCardById } from "@/data/cards";
import type { Spread } from "@/data/spreads";
import type { ReadingResult } from "@/lib/reading";
import ChatPanel from "@/components/ChatPanel";
import ChatUpsell from "@/components/ChatUpsell";
import DayDeep from "@/components/DayDeep";
import Price from "@/components/Price";
import PayModal from "@/components/PayModal";
import Spinner from "@/components/Spinner";
import TarotCardView from "@/components/TarotCardView";
import { cardsWordAccusative, cardsWordNominative } from "@/lib/pluralize";

interface Paywall {
  title: string;
  price: number;
}

interface DrawnCard {
  cardId: string;
  reversed: boolean;
  revealed: boolean;
}

interface HeroCard {
  cardId: string;
  reversed: boolean;
  index: number; // куда карта в итоге ляжет
}

// Натуральная ширина карты «крупным планом» в центре стола (масштабируется вместе
// со столом через zoom — на телефоне это всё равно заметно крупнее, чем в слоте).
const HERO_WIDTH = 220;

function shuffledIds(): string[] {
  const ids = CARDS.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export default function SpreadClient({
  spread,
  paywall,
  questionExample,
}: {
  spread: Spread;
  paywall?: Paywall | null;
  questionExample?: string;
}) {
  const [deckOrder, setDeckOrder] = useState<string[]>(() => shuffledIds());
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [question, setQuestion] = useState("");
  const [started, setStarted] = useState(!spread.askQuestion);
  const [paid, setPaid] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [chatAddonPaid, setChatAddonPaid] = useState(false);
  const [showChatPay, setShowChatPay] = useState(false);
  const [cardTexts, setCardTexts] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState("");
  const [advice, setAdvice] = useState("");
  const [readingDone, setReadingDone] = useState(false);
  const [readingError, setReadingError] = useState(false);
  const fetchStarted = useRef(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(0);
  const [heroCard, setHeroCard] = useState<HeroCard | null>(null);
  const [heroSettled, setHeroSettled] = useState(false);

  // Замеряем ширину поля расклада — по ней масштабируем всю раскладку целиком.
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setBoardW(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [started]);

  useEffect(() => {
    const idx = drawn.findIndex((d) => !d.revealed);
    if (idx === -1) return;
    const t = setTimeout(() => {
      setDrawn((prev) => prev.map((d, i) => (i === idx ? { ...d, revealed: true } : d)));
    }, 150);
    return () => clearTimeout(t);
  }, [drawn]);

  // Раскладах от 7 карт: вытянутая карта сперва показывается крупно в центре стола,
  // затем едет и уменьшается в свой слот. До 7 карт — обычный флип на месте (выше).
  const useHeroReveal = spread.cardCount >= 7;

  useEffect(() => {
    if (!heroCard || heroSettled) return;
    const t = setTimeout(() => setHeroSettled(true), 1300);
    return () => clearTimeout(t);
  }, [heroCard, heroSettled]);

  useEffect(() => {
    if (!heroCard || !heroSettled) return;
    const t = setTimeout(() => {
      setDrawn((prev) => [
        ...prev,
        { cardId: heroCard.cardId, reversed: heroCard.reversed, revealed: true },
      ]);
      setHeroCard(null);
      setHeroSettled(false);
    }, 650);
    return () => clearTimeout(t);
  }, [heroCard, heroSettled]);

  const complete = drawn.length === spread.cardCount;
  const allRevealed = complete && drawn.every((d) => d.revealed);
  const cardsRead = Object.keys(cardTexts).length;
  const readingLoading = allRevealed && !readingDone && !readingError;

  // Готовый разбор для чата и итогового блока — собираем из потоковых кусков.
  const reading: ReadingResult | null = readingDone
    ? {
        cards: spread.positions.map((pos, i) => {
          const d = drawn[i];
          const card = getCardById(d.cardId)!;
          return {
            label: pos.label,
            name: card.name,
            reversed: d.reversed,
            text: cardTexts[i] ?? (d.reversed ? card.reversed : card.upright),
          };
        }),
        summary,
        advice,
      }
    : null;

  // Как только все карты открыты — стримим разбор AI-таролога (один раз).
  useEffect(() => {
    if (!allRevealed || fetchStarted.current) return;
    fetchStarted.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            spreadId: spread.id,
            question,
            cards: drawn.map((d) => ({ cardId: d.cardId, reversed: d.reversed })),
          }),
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
          let evt: {
            type?: string;
            index?: unknown;
            text?: unknown;
          };
          try {
            evt = JSON.parse(trimmed);
          } catch {
            return;
          }
          if (
            evt.type === "card" &&
            typeof evt.index === "number" &&
            typeof evt.text === "string"
          ) {
            const idx = evt.index;
            const txt = evt.text;
            setCardTexts((prev) => (prev[idx] ? prev : { ...prev, [idx]: txt }));
          } else if (evt.type === "summary" && typeof evt.text === "string") {
            setSummary(evt.text);
          } else if (evt.type === "advice" && typeof evt.text === "string") {
            setAdvice(evt.text);
          } else if (evt.type === "error") {
            sawError = true;
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            handle(buf.slice(0, nl));
            buf = buf.slice(nl + 1);
          }
        }
        handle(buf);

        if (sawError) setReadingError(true);
        setReadingDone(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setReadingError(true);
        setReadingDone(true);
      }
    })();

    return () => controller.abort();
  }, [allRevealed, spread.id, question, drawn]);

  function handleDraw(cardId: string) {
    if (drawn.length >= spread.cardCount || heroCard) return;
    const reversed = Math.random() < 0.5;
    if (useHeroReveal) {
      setHeroCard({ cardId, reversed, index: drawn.length });
      setHeroSettled(false);
    } else {
      setDrawn((prev) => [...prev, { cardId, reversed, revealed: false }]);
    }
  }

  function reset() {
    setDrawn([]);
    setDeckOrder(shuffledIds());
    setCardTexts({});
    setSummary("");
    setAdvice("");
    setReadingDone(false);
    setReadingError(false);
    setHeroCard(null);
    setHeroSettled(false);
    fetchStarted.current = false;
  }

  const remainingDeck = deckOrder.filter(
    (id) => !drawn.some((d) => d.cardId === id) && id !== heroCard?.cardId,
  );

  // Колода под выбор: на узких экранах меньше карт и они компактнее.
  const narrow = boardW > 0 && boardW < 560;

  // «Натуральный» размер поля — раскладка спроектирована под него, дальше просто масштабируется.
  // На телефоне для больших раскладов (от 7 карт) стол вытягиваем по высоте и берём
  // карты покрупнее — ширина всё равно зажата экраном, а по вертикали обычно есть
  // запас (страница станет чуть длиннее, но карты будут читаемыми).
  const bigSpread = spread.cardCount > 6;
  const positionCardWidth = bigSpread
    ? narrow
      ? 76
      : 48
    : spread.cardCount > 3
      ? 60
      : spread.cardCount === 1
        ? 108
        : 86;
  const NATURAL_W = bigSpread ? 820 : 680;
  const [aspW, aspH] = spread.containerAspect.split("/").map(Number);
  const heightBoost = bigSpread && narrow ? 1.85 : 1;
  const NATURAL_H = NATURAL_W * (aspH / aspW) * heightBoost;
  // На больших экранах не раздуваем стол больше натурального размера.
  const boardScale = boardW > 0 ? Math.min(1, boardW / NATURAL_W) : 1;

  const deckCardW = narrow ? 56 : 78;
  const deckVisible = narrow ? 12 : 20;

  const needsPayment = !!paywall && !paid;
  const chatAddonPrice = paywall ? Math.round(paywall.price / 2) : 0;
  // Диалог с AI-тарологом: встроен в расклад, докуплен или доступен как допродажа.
  const chatUnlocked = !!spread.chat || chatAddonPaid;
  const chatOffered = !spread.chat && !!paywall;

  if (!started) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-7">
          <label htmlFor="q" className="eyebrow block mb-3">
            Ваш вопрос картам
          </label>
          <textarea
            id="q"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Например: ${
              questionExample ?? "опишите свою ситуацию или задайте вопрос"
            }`}
            className="w-full resize-none rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2.5 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]"
          />
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Сформулируйте конкретно и об одном. Держите вопрос в голове, пока
            тасуете и выбираете карты.
          </p>
          <button
            onClick={() => (needsPayment ? setShowPay(true) : setStarted(true))}
            disabled={question.trim().length < 5}
            className="btn-gold mt-5 inline-flex items-center gap-1.5 rounded-full px-7 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {needsPayment && paywall ? (
              <>
                Разложить карты · <Price amount={paywall.price} />
              </>
            ) : (
              "Разложить карты"
            )}
          </button>
        </div>

        {showPay && paywall && (
          <PayModal
            title={paywall.title}
            subtitle={`${spread.name} · ${spread.cardCount} ${cardsWordNominative(
              spread.cardCount,
            )} · разбор AI-таролога`}
            price={paywall.price}
            onPay={() => {
              setPaid(true);
              setShowPay(false);
              setStarted(true);
            }}
            onCancel={() => setShowPay(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {question && (
        <div className="text-center mb-3">
          <p className="font-display italic text-lg sm:text-xl text-[var(--gold-soft)]">
            «{question}»
          </p>
          <button
            onClick={() => {
              setStarted(false);
              reset();
            }}
            className="mt-1 text-xs text-[var(--muted)] hover:text-[var(--gold-soft)] transition-colors"
          >
            ← изменить вопрос
          </button>
        </div>
      )}
      <div
        ref={boardRef}
        className="w-full mx-auto mt-5 mb-7 max-w-[880px] px-6 sm:px-2"
      >
        <div
          className="relative mx-auto"
          style={{ width: NATURAL_W, height: NATURAL_H, zoom: boardScale }}
        >
          <div aria-hidden className="spread-surface" />
          {heroCard && (
            <div
              className="hero-card absolute z-20"
              style={{
                left: heroSettled ? `${spread.positions[heroCard.index].x}%` : "50%",
                top: heroSettled ? `${spread.positions[heroCard.index].y}%` : "50%",
                transform: `translate(-50%, -50%) scale(${
                  heroSettled ? positionCardWidth / HERO_WIDTH : 1
                })`,
              }}
            >
              {!heroSettled && <div aria-hidden className="hero-card-glow" />}
              <TarotCardView
                card={getCardById(heroCard.cardId) ?? null}
                faceUp
                reversed={heroCard.reversed}
                width={HERO_WIDTH}
              />
            </div>
          )}
          {spread.positions.map((pos, i) => {
              const d = drawn[i];
              const card = d ? getCardById(d.cardId) : null;
              const side = pos.labelSide ?? (pos.rotate ? "top" : "bottom");
              const labelStyle: CSSProperties = {
                color: "var(--bone-dim)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              };
              if (side === "bottom") {
                Object.assign(labelStyle, {
                  left: "50%",
                  top: "calc(100% + 10px)",
                  transform: "translateX(-50%)",
                });
              } else if (side === "top") {
                Object.assign(labelStyle, {
                  left: "50%",
                  bottom: "calc(100% + 10px)",
                  transform: "translateX(-50%)",
                });
              } else if (side === "right") {
                Object.assign(labelStyle, {
                  left: "calc(100% + 12px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                });
              } else {
                Object.assign(labelStyle, {
                  right: "calc(100% + 12px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                });
              }
              return (
                <div
                  key={i}
                  className="absolute z-10"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div style={{ transform: `rotate(${pos.rotate ?? 0}deg)` }}>
                    {d ? (
                      <TarotCardView
                        card={card ?? null}
                        faceUp={!!d.revealed}
                        reversed={d.reversed}
                        width={positionCardWidth}
                      />
                    ) : (
                      <div
                        className="card-slot"
                        style={{ width: positionCardWidth, aspectRatio: "500 / 878" }}
                      />
                    )}
                  </div>
                  <span
                    className="absolute text-xs uppercase tracking-wide text-center whitespace-nowrap"
                    style={labelStyle}
                  >
                    {pos.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {!complete && (
        <div className="mb-4 text-center">
          <p className="text-sm text-[var(--muted)]">
            Сосредоточьтесь на вопросе и выберите {spread.cardCount - drawn.length}{" "}
            {cardsWordAccusative(spread.cardCount - drawn.length)} из колоды ниже.
          </p>
        </div>
      )}

      {!complete && (
        <div className="relative max-w-5xl mx-auto px-2 mb-6">
          <div aria-hidden className="deck-surface" />
          <div className="relative z-10 flex flex-wrap justify-center">
            {remainingDeck.slice(0, deckVisible).map((id, i) => (
              <div
                key={id}
                style={{ marginLeft: i === 0 ? 0 : -(deckCardW * 0.58) }}
              >
                <TarotCardView
                  card={null}
                  faceUp={false}
                  onClick={() => handleDraw(id)}
                  width={deckCardW}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {complete && (
        <div className="max-w-4xl mx-auto w-full mb-16">
          <h2 className="font-display text-2xl text-center" style={{ color: "var(--gold-soft)" }}>
            Что говорят карты
          </h2>
          {readingLoading && (
            <p className="flex items-center justify-center gap-2 text-sm text-[var(--muted)] mt-2">
              <Spinner size={14} className="text-[var(--gold)]" />
              AI-таролог читает карты…
              {cardsRead > 0 && ` ${cardsRead} / ${spread.cardCount}`}
            </p>
          )}
          {readingError && cardsRead === 0 && (
            <p className="text-center text-sm text-[var(--muted)] mt-1">
              Не удалось получить разбор — ниже базовые значения карт.
            </p>
          )}

          {reading && (spread.chat || chatOffered) && (
            <div className="text-center mt-4">
              <button
                onClick={() =>
                  chatRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="btn-ghost rounded-full px-6 py-2.5 text-sm"
              >
                {chatUnlocked
                  ? "Обсудить расклад с AI-тарологом ↓"
                  : "Продолжить с AI-тарологом ↓"}
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {spread.positions.map((pos, i) => {
              const d = drawn[i];
              const card = getCardById(d.cardId)!;
              const aiText = cardTexts[i];
              const text = aiText ?? (d.reversed ? card.reversed : card.upright);
              return (
                <div
                  key={i}
                  className="w-full sm:w-[calc(50%-0.375rem)] rounded-lg border p-3.5"
                  style={{ borderColor: "rgba(201,163,95,0.22)", background: "rgba(25,22,19,0.6)" }}
                >
                  <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    {pos.label}
                  </p>
                  <p className="mb-1.5">
                    <span className="font-display text-base" style={{ color: "var(--gold-soft)" }}>
                      {card.name}
                    </span>
                    {d.reversed && (
                      <span className="text-[11px] ml-2" style={{ color: "var(--gold)" }}>
                        перевёрнутая
                      </span>
                    )}
                  </p>
                  {readingLoading && !aiText ? (
                    <div className="flex py-1.5 text-[var(--gold)]">
                      <Spinner size={18} />
                    </div>
                  ) : (
                    <p
                      className={`text-[13px] leading-snug text-[var(--foreground)]/90${
                        aiText ? " fade-in" : ""
                      }`}
                    >
                      {text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {summary && (
            <div
              className="mt-4 rounded-xl border p-6 sm:p-7 fade-in"
              style={{
                borderColor: "var(--gold-deep)",
                background: "rgba(201,163,95,0.06)",
                boxShadow: "inset 0 1px 0 rgba(227,200,143,0.12)",
              }}
            >
              <p className="eyebrow text-center mb-3">Общая картина</p>
              <p className="text-[15px] leading-relaxed text-[var(--bone)]">
                {summary}
              </p>
              {advice && (
                <div
                  className="mt-5 pt-4 border-t"
                  style={{ borderColor: "rgba(122,95,48,0.5)" }}
                >
                  <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">
                    Совет
                  </p>
                  <p className="text-[15px] leading-relaxed text-[var(--gold-soft)]">
                    {advice}
                  </p>
                </div>
              )}
            </div>
          )}

          {spread.id === "day" && reading && drawn[0] && (
            <DayDeep cardId={drawn[0].cardId} reversed={drawn[0].reversed} />
          )}

          {reading && (spread.chat || chatOffered) && (
            <div ref={chatRef} className="scroll-mt-20">
              {chatUnlocked ? (
                <ChatPanel
                  spreadName={spread.name}
                  question={question}
                  reading={reading}
                />
              ) : (
                <ChatUpsell
                  price={chatAddonPrice}
                  onOpen={() => setShowChatPay(true)}
                />
              )}
            </div>
          )}

          {showChatPay && paywall && (
            <PayModal
              heading="Диалог с AI-тарологом"
              title="Диалог с AI-тарологом"
              subtitle={`По раскладу «${spread.name}» · AI помнит все карты`}
              price={chatAddonPrice}
              onPay={() => {
                setChatAddonPaid(true);
                setShowChatPay(false);
              }}
              onCancel={() => setShowChatPay(false)}
            />
          )}

          <div className="text-center mt-5">
            <Link
              href="/"
              className="inline-block rounded-full px-6 py-2 text-sm border transition-colors hover:bg-[var(--gold)]/10"
              style={{ borderColor: "var(--gold)", color: "var(--gold-soft)" }}
            >
              Закончить расклад
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

