import type { NatalChart } from "@/lib/natal/compute";
import NatalWheel from "@/components/NatalWheel";
import AspectGrid from "@/components/AspectGrid";

// Отрисовка натальной карты в профиле. Данные — из natal_charts.chart (jsonb).

const DIGNITY_STRONG = new Set(["обитель", "экзальтация"]);

// jsonb в Postgres не сохраняет порядок ключей объекта — задаём его явно.
function Bar({
  data,
  order,
}: {
  data: Record<string, number>;
  order: [string, string][]; // [key, ru-label]
}) {
  return (
    <div className="space-y-1.5">
      {order.map(([k, label]) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 text-[var(--bone-dim)]">{label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--ink-900)]">
            <span
              className="block h-full rounded-full bg-[var(--gold)]"
              style={{ width: `${data[k] ?? 0}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-[var(--muted)]">
            {data[k] ?? 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

const EMPTY_PCT = { fire: 0, earth: 0, air: 0, water: 0, cardinal: 0, fixed: 0, mutable: 0 };

export default function NatalChartView({ chart }: { chart: NatalChart }) {
  // Мягкие дефолты — на случай карты старого формата, которую не удалось пересчитать.
  const meta = chart.meta;
  const placements = chart.placements ?? [];
  const nodes = chart.nodes ?? [];
  const ascendant = chart.ascendant ?? null;
  const midheaven = chart.midheaven ?? null;
  const houses = chart.houses ?? [];
  const aspects = chart.aspects ?? [];
  const chartRuler = chart.chartRuler ?? null;
  const lunarPhase = chart.lunarPhase ?? "—";
  const stelliums = chart.stelliums ?? [];
  const hemispheres = chart.hemispheres ?? null;
  const balance = {
    elementsPct: chart.balance?.elementsPct ?? EMPTY_PCT,
    modalitiesPct: chart.balance?.modalitiesPct ?? EMPTY_PCT,
  };

  return (
    <div className="rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl text-[var(--gold-soft)]">
          Натальная карта — {meta.name}
        </h2>
        <p className="text-xs text-[var(--muted)]">
          {meta.birthDate}
          {meta.birthTime ? ` · ${meta.birthTime}` : " · время неизвестно"} · {meta.timezone}
        </p>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Тропический зодиак, дома Placidus · {meta.lat}, {meta.lon}
      </p>

      {/* Колесо */}
      <div className="my-5">
        <NatalWheel chart={chart} />
      </div>

      {/* Планеты */}
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {placements.map((p) => (
          <div
            key={p.key}
            className="flex items-baseline justify-between gap-3 border-b border-[var(--ink-600)] py-1"
          >
            <span className="text-sm text-[var(--bone-dim)]">
              {p.label}
              {p.retrograde && (
                <span className="ml-1 text-[var(--gold)]" title="ретроградная">R</span>
              )}
            </span>
            <span className="text-right text-sm text-[var(--bone)]">
              {p.sign} {p.degreeText}
              {p.house ? <span className="text-[var(--muted)]"> · {p.house} дом</span> : null}
              {p.dignityLabel && (
                <span
                  className="ml-1.5 text-[11px]"
                  style={{
                    color: DIGNITY_STRONG.has(p.dignityLabel)
                      ? "var(--gold-soft)"
                      : "var(--rose)",
                  }}
                >
                  {p.dignityLabel}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Углы, управитель, фаза Луны */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        {ascendant && (
          <span className="text-[var(--bone-dim)]">
            Асцендент:{" "}
            <span className="text-[var(--gold-soft)]">
              {ascendant.sign} {ascendant.degreeText}
            </span>
          </span>
        )}
        {midheaven && (
          <span className="text-[var(--bone-dim)]">
            MC:{" "}
            <span className="text-[var(--gold-soft)]">
              {midheaven.sign} {midheaven.degreeText}
            </span>
          </span>
        )}
        {chartRuler && (
          <span className="text-[var(--bone-dim)]">
            Управитель карты:{" "}
            <span className="text-[var(--gold-soft)]">
              {chartRuler.label} в {chartRuler.sign}
              {chartRuler.house ? `, ${chartRuler.house} дом` : ""}
            </span>
          </span>
        )}
        {lunarPhase !== "—" && (
          <span className="text-[var(--bone-dim)]">
            Фаза Луны: <span className="text-[var(--gold-soft)]">{lunarPhase}</span>
          </span>
        )}
      </div>

      {nodes.length > 0 && (
        <p className="mt-3 text-sm text-[var(--bone-dim)]">
          {nodes.map((n) => `${n.label}: ${n.sign} ${n.degreeText}`).join(" · ")}
        </p>
      )}

      {stelliums.length > 0 && (
        <p className="mt-3 text-sm text-[var(--bone-dim)]">
          Стеллиум:{" "}
          {stelliums.map((s) => `${s.planets.join(", ")} в ${s.where}`).join("; ")}
        </p>
      )}
      {hemispheres && hemispheres.label && (
        <p className="mt-2 text-sm text-[var(--muted)]">{hemispheres.label}</p>
      )}

      {/* Баланс стихий/крестов в % */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">Стихии</p>
          <Bar
            data={balance.elementsPct}
            order={[
              ["fire", "Огонь"],
              ["earth", "Земля"],
              ["air", "Воздух"],
              ["water", "Вода"],
            ]}
          />
        </div>
        <div>
          <p className="eyebrow mb-2">Кресты</p>
          <Bar
            data={balance.modalitiesPct}
            order={[
              ["cardinal", "Кардин."],
              ["fixed", "Фикс."],
              ["mutable", "Мутаб."],
            ]}
          />
        </div>
      </div>

      {/* Дома */}
      {houses.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--gold-soft)]">
            Куспиды домов
          </summary>
          <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {houses.map((h) => (
              <span key={h.house} className="text-[var(--bone-dim)]">
                {h.house} дом: {h.sign} {h.degreeText}
              </span>
            ))}
          </div>
        </details>
      )}

      {/* Аспекты: сетка + список */}
      {aspects.length > 0 && (
        <details className="mt-3 text-sm" open>
          <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--gold-soft)]">
            Аспекты ({aspects.length})
          </summary>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start">
            <AspectGrid chart={chart} />
            <ul className="space-y-1">
              {aspects.map((a, i) => (
                <li key={i} className="text-[var(--bone-dim)]">
                  {a.a} {a.type} {a.b}{" "}
                  <span className="text-[var(--muted)]">(орб {a.orb}°)</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}
