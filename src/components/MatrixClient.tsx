"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  computeMatrix,
  computeFullMatrix,
  type MatrixPoint,
} from "@/lib/matrix";
import PayModal from "@/components/PayModal";
import Spinner from "@/components/Spinner";
import ChatPanel from "@/components/ChatPanel";
import Price from "@/components/Price";
import type { ReadingResult } from "@/lib/reading";

const FULL_PRICE = 390;

export default function MatrixClient() {
  const [date, setDate] = useState("");
  const [points, setPoints] = useState<MatrixPoint[] | null>(null);
  const [error, setError] = useState(false);

  const [showPay, setShowPay] = useState(false);
  const [paid, setPaid] = useState(false);

  const [intro, setIntro] = useState("");
  const [pointTexts, setPointTexts] = useState<Record<number, string>>({});
  const [advice, setAdvice] = useState("");
  const [fullDone, setFullDone] = useState(false);
  const [fullError, setFullError] = useState(false);
  const fetchStarted = useRef(false);

  const fullPoints = useMemo(
    () => (paid && date ? computeFullMatrix(date) : null),
    [paid, date],
  );
  const fullLoading = paid && !fullDone && !fullError;
  const pointsRead = Object.keys(pointTexts).length;

  // Готовый разбор как контекст для диалога с AI-тарологом (включён в 390 ₽).
  const matrixReading: ReadingResult | null =
    fullDone && fullPoints
      ? {
          cards: fullPoints.map((p, i) => ({
            label: p.title,
            name: p.arcana.name,
            reversed: false,
            text: pointTexts[i] ?? p.arcana.upright,
          })),
          summary: intro,
          advice,
        }
      : null;

  function calc() {
    const result = computeMatrix(date);
    setPoints(result);
    setError(!result);
  }

  function resetFull() {
    setPaid(false);
    setShowPay(false);
    setIntro("");
    setPointTexts({});
    setAdvice("");
    setFullDone(false);
    setFullError(false);
    fetchStarted.current = false;
  }

  // После «оплаты» — стримим полный разбор матрицы (один раз).
  useEffect(() => {
    if (!paid || fetchStarted.current) return;
    fetchStarted.current = true;
    const controller = new AbortController();

    (async () => {
      try {
        if (!fullPoints) throw new Error("bad-date");
        const res = await fetch("/api/matrix", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ birthDate: date }),
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
          let evt: { type?: string; index?: unknown; text?: unknown };
          try {
            evt = JSON.parse(trimmed);
          } catch {
            return;
          }
          if (evt.type === "intro" && typeof evt.text === "string") {
            setIntro(evt.text);
          } else if (evt.type === "advice" && typeof evt.text === "string") {
            setAdvice(evt.text);
          } else if (
            evt.type === "point" &&
            typeof evt.index === "number" &&
            typeof evt.text === "string"
          ) {
            const idx = evt.index;
            const txt = evt.text;
            setPointTexts((prev) => (prev[idx] ? prev : { ...prev, [idx]: txt }));
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

        if (sawError) setFullError(true);
        setFullDone(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setFullError(true);
        setFullDone(true);
      }
    })();

    return () => controller.abort();
  }, [paid, date, fullPoints]);

  return (
    <div>
      <div className="rounded-xl border border-[var(--ink-600)] bg-[var(--ink-800)] p-7 max-w-md">
        <label htmlFor="bday" className="eyebrow block mb-3">
          Дата рождения
        </label>
        <input
          id="bday"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPoints(null);
            setError(false);
            resetFull();
          }}
          className="w-full rounded-md border border-[var(--ink-600)] bg-[var(--ink-900)] px-3 py-2 text-sm text-[var(--bone)] outline-none focus:border-[var(--gold)]"
        />
        <button
          onClick={calc}
          disabled={!date}
          className="btn-gold mt-5 rounded-full px-7 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Рассчитать матрицу
        </button>
        {error && (
          <p className="mt-3 text-xs" style={{ color: "var(--rose)" }}>
            Проверьте дату рождения.
          </p>
        )}
      </div>

      {points && !paid && (
        <>
          <div className="mt-12 grid sm:grid-cols-2 gap-px bg-[var(--ink-600)] border border-[var(--ink-600)] rounded-xl overflow-hidden">
            {points.map((p) => (
              <div key={p.key} className="bg-[var(--ink-800)] p-6 flex gap-5">
                <div className="shrink-0 w-[88px] h-fit rounded-md overflow-hidden border border-[var(--gold-deep)] bg-[#efe7d6] p-1.5">
                  <Image
                    src={p.arcana.image}
                    alt={p.arcana.name}
                    width={88}
                    height={155}
                    className="block"
                  />
                </div>
                <div className="min-w-0">
                  <p className="eyebrow mb-1">{p.title}</p>
                  <h3 className="font-display text-xl text-[var(--gold-soft)]">
                    {p.arcana.name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                    {p.desc}
                  </p>
                  <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed">
                    {p.arcana.upright}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-7 text-center">
            <h3 className="font-display text-xl text-[var(--gold-soft)]">
              Полная матрица судьбы
            </h3>
            <p className="mt-2 text-sm text-[var(--bone-dim)] max-w-lg mx-auto leading-relaxed">
              Восемь позиций — портрет личности, ресурс, родовая программа, задача
              жизни, линия любви, деньги, кармический хвост и зона таланта — со
              связным разбором AI-таролога и диалогом с ним в чате.
            </p>
            <button
              onClick={() => setShowPay(true)}
              className="btn-gold mt-6 inline-flex items-center gap-1.5 rounded-full px-8 py-3 text-sm"
            >
              Открыть полный разбор · <Price amount={FULL_PRICE} />
            </button>
          </div>
        </>
      )}

      {paid && (
        <div className="mt-12">
          <h2
            className="font-display text-2xl text-center"
            style={{ color: "var(--gold-soft)" }}
          >
            Полная матрица судьбы
          </h2>
          {fullLoading && (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
              <Spinner size={14} className="text-[var(--gold)]" />
              AI-таролог составляет разбор…
              {pointsRead > 0 &&
                ` ${pointsRead} / ${fullPoints ? fullPoints.length : 8}`}
            </p>
          )}
          {fullError && pointsRead === 0 && !intro && (
            <p className="mt-1 text-center text-sm text-[var(--muted)]">
              Не удалось получить разбор. Попробуйте пересчитать матрицу.
            </p>
          )}

          {intro ? (
            <div
              className="mt-5 rounded-xl border p-6 sm:p-7 fade-in"
              style={{
                borderColor: "var(--gold-deep)",
                background: "rgba(201,163,95,0.06)",
                boxShadow: "inset 0 1px 0 rgba(227,200,143,0.12)",
              }}
            >
              <p className="eyebrow text-center mb-3">Портрет по матрице</p>
              <p className="text-[15px] leading-relaxed text-[var(--bone)]">
                {intro}
              </p>
            </div>
          ) : (
            fullLoading && (
              <div className="mt-5 flex justify-center py-4 text-[var(--gold)]">
                <Spinner size={20} />
              </div>
            )
          )}

          {advice && (
            <div
              className="mt-4 rounded-xl border p-5 sm:p-6 fade-in"
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

          <p className="eyebrow text-center mt-8 mb-1">Арканы по позициям</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-px bg-[var(--ink-600)] border border-[var(--ink-600)] rounded-xl overflow-hidden">
            {(fullPoints ?? []).map((p, i) => {
              const text = pointTexts[i];
              return (
                <div key={p.key} className="bg-[var(--ink-800)] p-6 flex gap-5">
                  <div className="shrink-0 w-[88px] h-fit rounded-md overflow-hidden border border-[var(--gold-deep)] bg-[#efe7d6] p-1.5">
                    <Image
                      src={p.arcana.image}
                      alt={p.arcana.name}
                      width={88}
                      height={155}
                      className="block"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow mb-1">{p.title}</p>
                    <h3 className="font-display text-xl text-[var(--gold-soft)]">
                      {p.arcana.name}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                      {p.desc}
                    </p>
                    {text ? (
                      <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed fade-in">
                        {text}
                      </p>
                    ) : fullLoading ? (
                      <div className="mt-3 flex py-1 text-[var(--gold)]">
                        <Spinner size={16} />
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--bone-dim)] leading-relaxed">
                        {p.arcana.upright}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {matrixReading && (
            <div className="mt-4">
              <ChatPanel
                spreadName="Матрица судьбы"
                question={date ? `дата рождения ${date}` : ""}
                reading={matrixReading}
                kind="matrix"
              />
            </div>
          )}

          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-block rounded-full px-6 py-2 text-sm border transition-colors hover:bg-[var(--gold)]/10"
              style={{ borderColor: "var(--gold)", color: "var(--gold-soft)" }}
            >
              На главную
            </Link>
          </div>
        </div>
      )}

      {showPay && (
        <PayModal
          heading="Матрица судьбы"
          title="Полная матрица судьбы"
          subtitle="8 позиций · разбор AI-таролога · диалог с ним в чате"
          price={FULL_PRICE}
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
