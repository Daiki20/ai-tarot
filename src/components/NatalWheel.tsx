import type { NatalChart } from "@/lib/natal/compute";

/**
 * Колесо натальной карты — SVG, считается на сервере из chart (детерминировано).
 * Стиль наш: тёплый чёрный фон, золото, роза для напряжённых аспектов.
 * Без времени рождения дома/ASC/MC не рисуются — колесо строится от 0° Овна слева.
 */

const C = 200; // центр
const R_SIGN_OUT = 192;
const R_SIGN_IN = 162;
const R_TICK_IN = 154;
const R_PLANET_TICK_OUT = 162;
const R_PLANET_TICK_IN = 150;
const R_PLANET = 138;
const R_HOUSE_OUT = 162;
const R_HOUSE_NUM = 56;
const R_ASPECT = 106;
const R_INNER = 46;

const SIGN_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
const ELEMENT_TINT: Record<string, string> = {
  fire: "rgba(201,163,95,0.10)",
  earth: "rgba(201,163,95,0.04)",
  air: "rgba(201,163,95,0.10)",
  water: "rgba(201,163,95,0.04)",
};
const ELEMENT_OF: Record<string, string> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

const PLANET_GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
  chiron: "⚷", northnode: "☊", southnode: "☋", lilith: "⚸",
};

const HARMONIOUS = new Set(["trine", "sextile", "conjunction"]);

const GLYPH_FONT =
  '"Segoe UI Symbol","Noto Sans Symbols2","Apple Symbols","DejaVu Sans",serif';

function pt(lonDeg: number, radius: number, ascLon: number) {
  const theta = ((180 + (lonDeg - ascLon)) * Math.PI) / 180;
  return { x: C + radius * Math.cos(theta), y: C - radius * Math.sin(theta) };
}

export default function NatalWheel({ chart }: { chart: NatalChart }) {
  const houseCusps = chart.houseCusps ?? [];
  const placements = chart.placements ?? [];
  const chartNodes = chart.nodes ?? [];
  const chartAspects = chart.aspects ?? [];
  const hasHouses = houseCusps.length === 12;
  const ascLon = hasHouses && chart.ascendant ? chart.ascendant.lon : 0;

  // Тела на колесе: 11 планет + Восходящий узел + Лилит.
  const bodies = [
    ...placements,
    ...chartNodes.filter((n) => n.key === "northnode" || n.key === "lilith"),
  ].filter((b) => typeof b.lon === "number");

  // Старый формат карты без абсолютных долгот — колесо не построить.
  if (bodies.length === 0) {
    return (
      <p className="text-center text-xs text-[var(--muted)]">
        Карта в старом формате — пересчитайте её в профиле, чтобы увидеть колесо.
      </p>
    );
  }

  // Разводим близкие по долготе глифы (тик всё равно указывает на истинный градус).
  const MIN_SEP = 10;
  const sorted = [...bodies]
    .map((b) => ({ ...b, displayLon: b.lon }))
    .sort((a, b) => a.lon - b.lon);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    if (sorted[i].displayLon - prev.displayLon < MIN_SEP) {
      sorted[i].displayLon = prev.displayLon + MIN_SEP;
    }
  }

  // 5°-тики по всему кругу
  const ticks: { x1: number; y1: number; x2: number; y2: number; long: boolean }[] = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const long = deg % 30 === 0;
    const a = pt(deg, R_SIGN_IN, ascLon);
    const b = pt(deg, long ? R_SIGN_IN - 10 : R_TICK_IN, ascLon);
    ticks.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, long });
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <svg
        viewBox="-24 -24 448 448"
        className="w-full h-auto"
        role="img"
        aria-label={`Натальная карта — ${chart.meta.name}`}
      >
        {/* фон */}
        <circle cx={C} cy={C} r={R_SIGN_OUT} fill="var(--ink-800)" />
        <circle cx={C} cy={C} r={R_ASPECT + 2} fill="var(--ink-900)" />

        {/* сектора знаков + тинт по стихии + радиальные границы */}
        {SIGN_KEYS.map((key, i) => {
          const start = pt(i * 30, R_SIGN_OUT, ascLon);
          const endOut = pt((i + 1) * 30, R_SIGN_OUT, ascLon);
          const endIn = pt((i + 1) * 30, R_SIGN_IN, ascLon);
          const startIn = pt(i * 30, R_SIGN_IN, ascLon);
          const dOut = `M ${start.x} ${start.y} A ${R_SIGN_OUT} ${R_SIGN_OUT} 0 0 0 ${endOut.x} ${endOut.y} L ${endIn.x} ${endIn.y} A ${R_SIGN_IN} ${R_SIGN_IN} 0 0 1 ${startIn.x} ${startIn.y} Z`;
          const mid = pt(i * 30 + 15, (R_SIGN_OUT + R_SIGN_IN) / 2, ascLon);
          const bIn = pt(i * 30, R_SIGN_IN, ascLon);
          const bOut = pt(i * 30, R_SIGN_OUT, ascLon);
          return (
            <g key={key}>
              <path d={dOut} fill={ELEMENT_TINT[ELEMENT_OF[key]]} />
              <line
                x1={bIn.x}
                y1={bIn.y}
                x2={bOut.x}
                y2={bOut.y}
                stroke="var(--gold-deep)"
                strokeWidth="0.75"
                opacity="0.9"
              />
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={GLYPH_FONT}
                fontSize="14"
                fill="var(--gold-soft)"
              >
                {SIGN_GLYPH[i]}
              </text>
            </g>
          );
        })}

        {/* кольца */}
        <circle cx={C} cy={C} r={R_SIGN_OUT} fill="none" stroke="var(--gold-deep)" strokeWidth="1" />
        <circle cx={C} cy={C} r={R_SIGN_IN} fill="none" stroke="var(--gold-deep)" strokeWidth="0.75" />
        <circle cx={C} cy={C} r={R_ASPECT} fill="none" stroke="var(--ink-600)" strokeWidth="1" />
        <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="var(--ink-600)" strokeWidth="1" />

        {/* градусные тики */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--gold-deep)"
            strokeWidth={t.long ? 1 : 0.5}
            opacity={t.long ? 0.9 : 0.5}
          />
        ))}

        {/* дома: обычные куспиды тонкие, углы (1/4/7/10) — золотые оси через центр */}
        {hasHouses &&
          houseCusps.map((cusp, i) => {
            const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
            if (isAngle) return null; // оси рисуем отдельно, поверх
            const a = pt(cusp, R_HOUSE_OUT, ascLon);
            const b = pt(cusp, R_INNER, ascLon);
            const nextCusp = houseCusps[(i + 1) % 12];
            const span = (((nextCusp - cusp) % 360) + 360) % 360;
            const num = pt(cusp + span / 2, R_HOUSE_NUM, ascLon);
            return (
              <g key={`h${i}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ink-600)" strokeWidth="0.75" />
                <text
                  x={num.x}
                  y={num.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="var(--muted)"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

        {/* номера домов у осей (1,4,7,10) */}
        {hasHouses &&
          [0, 3, 6, 9].map((i) => {
            const cusp = houseCusps[i];
            const span = ((((houseCusps[(i + 1) % 12] - cusp) % 360) + 360) % 360);
            const num = pt(cusp + span / 2, R_HOUSE_NUM, ascLon);
            return (
              <text
                key={`hn${i}`}
                x={num.x}
                y={num.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fill="var(--muted)"
              >
                {i + 1}
              </text>
            );
          })}

        {/* оси ASC–DSC и MC–IC + подписи AC/DC/MC/IC */}
        {hasHouses && chart.ascendant && chart.midheaven && (
          <g>
            {[
              { lon: chart.ascendant.lon, a: "AC", b: "DC" },
              { lon: chart.midheaven.lon, a: "MC", b: "IC" },
            ].map((ax) => {
              const p1 = pt(ax.lon, R_SIGN_IN, ascLon);
              const p2 = pt(ax.lon + 180, R_SIGN_IN, ascLon);
              const l1 = pt(ax.lon, R_SIGN_OUT + 14, ascLon);
              const l2 = pt(ax.lon + 180, R_SIGN_OUT + 14, ascLon);
              return (
                <g key={ax.a}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--gold)" strokeWidth="1" opacity="0.9" />
                  {[
                    { p: l1, t: ax.a },
                    { p: l2, t: ax.b },
                  ].map((lbl) => (
                    <text
                      key={lbl.t}
                      x={lbl.p.x}
                      y={lbl.p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      letterSpacing="0.5"
                      fill="var(--gold-soft)"
                    >
                      {lbl.t}
                    </text>
                  ))}
                </g>
              );
            })}
          </g>
        )}

        {/* аспекты */}
        {chartAspects.map((a, i) => {
          const p1 = bodies.find((b) => b.key === a.aKey);
          const p2 = bodies.find((b) => b.key === a.bKey);
          if (!p1 || !p2) return null;
          const x1 = pt(p1.lon, R_ASPECT, ascLon);
          const x2 = pt(p2.lon, R_ASPECT, ascLon);
          const warm = !HARMONIOUS.has(a.typeKey);
          return (
            <line
              key={`a${i}`}
              x1={x1.x}
              y1={x1.y}
              x2={x2.x}
              y2={x2.y}
              stroke={warm ? "var(--rose)" : "var(--gold)"}
              strokeWidth={a.typeKey === "conjunction" ? 1.2 : 0.8}
              opacity={0.45}
            />
          );
        })}

        {/* планеты */}
        {sorted.map((b) => {
          const tickOuter = pt(b.lon, R_PLANET_TICK_OUT, ascLon);
          const tickInner = pt(b.displayLon, R_PLANET_TICK_IN, ascLon);
          const g = pt(b.displayLon, R_PLANET, ascLon);
          const dot = pt(b.lon, R_ASPECT, ascLon);
          // «R» уводим к центру по радиусу — там нет соседних глифов.
          const rMark = pt(b.displayLon, R_PLANET - 11, ascLon);
          return (
            <g key={b.key}>
              <line
                x1={tickOuter.x}
                y1={tickOuter.y}
                x2={tickInner.x}
                y2={tickInner.y}
                stroke="var(--gold-soft)"
                strokeWidth="0.75"
                opacity="0.7"
              />
              <circle cx={dot.x} cy={dot.y} r="1.6" fill="var(--gold-soft)" />
              <text
                x={g.x}
                y={g.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={GLYPH_FONT}
                fontSize="14"
                fill="var(--bone)"
              >
                {PLANET_GLYPH[b.key] ?? "•"}
              </text>
              {b.retrograde && (
                <text
                  x={rMark.x}
                  y={rMark.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7"
                  fill="var(--gold)"
                >
                  ℞
                </text>
              )}
            </g>
          );
        })}

        <circle cx={C} cy={C} r="2" fill="var(--gold)" />
      </svg>
    </div>
  );
}
