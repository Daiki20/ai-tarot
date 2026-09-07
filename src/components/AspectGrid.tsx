import type { NatalChart } from "@/lib/natal/compute";

// Треугольная сетка аспектов между 10 планетами (как в проф. астропрограммах).
const KEYS = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];
const GLYPH: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};
const ASPECT_GLYPH: Record<string, string> = {
  conjunction: "☌", opposition: "☍", trine: "△", square: "□", sextile: "✳",
};
const HARMONIOUS = new Set(["trine", "sextile", "conjunction"]);
const GLYPH_FONT =
  '"Segoe UI Symbol","Noto Sans Symbols2","Apple Symbols","DejaVu Sans",serif';

export default function AspectGrid({ chart }: { chart: NatalChart }) {
  const lookup = new Map<string, { typeKey: string; orb: number }>();
  for (const a of chart.aspects ?? []) {
    lookup.set(`${a.aKey}|${a.bKey}`, { typeKey: a.typeKey, orb: a.orb });
    lookup.set(`${a.bKey}|${a.aKey}`, { typeKey: a.typeKey, orb: a.orb });
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse" style={{ fontFamily: GLYPH_FONT }}>
        <tbody>
          {KEYS.slice(1).map((rowKey, r) => (
            <tr key={rowKey}>
              <th className="pr-1.5 text-right text-[13px] font-normal text-[var(--gold-soft)]">
                {GLYPH[rowKey]}
              </th>
              {KEYS.slice(0, r + 1).map((colKey) => {
                const hit = lookup.get(`${rowKey}|${colKey}`);
                const warm = hit && !HARMONIOUS.has(hit.typeKey);
                return (
                  <td
                    key={colKey}
                    className="h-7 w-7 border border-[var(--ink-600)] text-center align-middle text-[13px]"
                    style={{
                      color: hit
                        ? warm
                          ? "var(--rose)"
                          : "var(--gold-soft)"
                        : "transparent",
                    }}
                    title={
                      hit
                        ? `${GLYPH[rowKey]} ${ASPECT_GLYPH[hit.typeKey]} ${GLYPH[colKey]} · орб ${hit.orb}°`
                        : undefined
                    }
                  >
                    {hit ? ASPECT_GLYPH[hit.typeKey] : ""}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th />
            {KEYS.slice(0, KEYS.length - 1).map((k) => (
              <th
                key={k}
                className="pt-1 text-center text-[13px] font-normal text-[var(--gold-soft)]"
              >
                {GLYPH[k]}
              </th>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
