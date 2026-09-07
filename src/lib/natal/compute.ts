/**
 * Расчёт натальной карты. Обёртка над circular-natal-horoscope-js (чистый JS,
 * тропический зодиак, дома Placidus, историческая таймзона по координатам).
 *
 * Что считаем — профессиональный минимум западной астрологии:
 *   - 10 планет + Хирон + Лунные узлы + Лилит: знак, абс. долгота, градус, дом, ретроградность
 *   - эссенциальные достоинства планет (обитель / экзальтация / изгнание / падение)
 *   - Асцендент, MC и 12 куспидов домов (Placidus) — если известно время рождения
 *   - управитель карты (управитель знака Асцендента и где он стоит)
 *   - мажорные аспекты между планетами + сетка аспектов
 *   - баланс стихий и крестов (в штуках и во взвешенных %)
 *   - фаза Луны при рождении, стеллиумы, акцент по полусферам
 *
 * Без времени рождения — карта без домов, Асцендента, MC (знаки планет верны,
 * Луна ± редкий пограничный случай).
 *
 * `chart` (jsonb в БД) — вся структура ниже; по ней рисуется колесо (NatalWheel).
 * `summary` — плотная текстовая выжимка для промптов AI-таролога.
 */
import { Origin, Horoscope } from "circular-natal-horoscope-js";

const SIGN_RU: Record<string, string> = {
  aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак",
  leo: "Лев", virgo: "Дева", libra: "Весы", scorpio: "Скорпион",
  sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы",
};

const PLANET_RU: Record<string, string> = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс",
  jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон",
  chiron: "Хирон", northnode: "Восходящий узел", southnode: "Нисходящий узел", lilith: "Лилит",
};

const ASPECT_RU: Record<string, string> = {
  conjunction: "соединение", sextile: "секстиль", square: "квадрат",
  trine: "трин", opposition: "оппозиция",
};

const ELEMENT_OF: Record<string, "fire" | "earth" | "air" | "water"> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};
const MODALITY_OF: Record<string, "cardinal" | "fixed" | "mutable"> = {
  aries: "cardinal", cancer: "cardinal", libra: "cardinal", capricorn: "cardinal",
  taurus: "fixed", leo: "fixed", scorpio: "fixed", aquarius: "fixed",
  gemini: "mutable", virgo: "mutable", sagittarius: "mutable", pisces: "mutable",
};

// Традиционные управители знаков (для управителя карты).
const RULER_OF: Record<string, string> = {
  aries: "mars", taurus: "venus", gemini: "mercury", cancer: "moon",
  leo: "sun", virgo: "mercury", libra: "venus", scorpio: "mars",
  sagittarius: "jupiter", capricorn: "saturn", aquarius: "saturn", pisces: "jupiter",
};

// Эссенциальные достоинства классических семи планет.
type DignityKey = "domicile" | "exaltation" | "detriment" | "fall";
const DIGNITY_RU: Record<DignityKey, string> = {
  domicile: "обитель", exaltation: "экзальтация", detriment: "изгнание", fall: "падение",
};
const DIGNITIES: Record<
  string,
  { domicile: string[]; exaltation: string[]; detriment: string[]; fall: string[] }
> = {
  sun: { domicile: ["leo"], exaltation: ["aries"], detriment: ["aquarius"], fall: ["libra"] },
  moon: { domicile: ["cancer"], exaltation: ["taurus"], detriment: ["capricorn"], fall: ["scorpio"] },
  mercury: { domicile: ["gemini", "virgo"], exaltation: ["virgo"], detriment: ["sagittarius", "pisces"], fall: ["pisces"] },
  venus: { domicile: ["taurus", "libra"], exaltation: ["pisces"], detriment: ["aries", "scorpio"], fall: ["virgo"] },
  mars: { domicile: ["aries", "scorpio"], exaltation: ["capricorn"], detriment: ["taurus", "libra"], fall: ["cancer"] },
  jupiter: { domicile: ["sagittarius", "pisces"], exaltation: ["cancer"], detriment: ["gemini", "virgo"], fall: ["capricorn"] },
  saturn: { domicile: ["capricorn", "aquarius"], exaltation: ["libra"], detriment: ["cancer", "leo"], fall: ["aries"] },
};
function dignityOf(planetKey: string, signKey: string): DignityKey | null {
  const t = DIGNITIES[planetKey];
  if (!t) return null;
  if (t.domicile.includes(signKey)) return "domicile";
  if (t.exaltation.includes(signKey)) return "exaltation";
  if (t.detriment.includes(signKey)) return "detriment";
  if (t.fall.includes(signKey)) return "fall";
  return null;
}

// Вес планеты в балансе стихий/крестов (в %).
const WEIGHT: Record<string, number> = {
  sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2,
  jupiter: 1, saturn: 1, uranus: 1, neptune: 1, pluto: 1,
};

const BODY_ORDER = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
  "chiron",
];
const BALANCE_BODIES = BODY_ORDER.slice(0, 10);

export interface NatalInput {
  name: string;
  gender?: string | null;
  birthDate: string; // YYYY-MM-DD (местная дата)
  birthTime: string | null; // HH:MM (местное) или null
  birthTimeKnown: boolean;
  lat: number;
  lon: number;
}

export interface NatalPlacement {
  key: string;
  label: string; // ru
  sign: string; // ru
  signKey: string;
  lon: number; // абсолютная эклиптическая долгота 0..360
  degree: number; // 0..29.99 внутри знака
  degreeText: string; // "29°09′"
  house: number | null;
  retrograde: boolean;
  dignity: DignityKey | null;
  dignityLabel: string | null; // ru
}

export interface NatalAspect {
  a: string; // ru планета 1
  b: string; // ru планета 2
  aKey: string;
  bKey: string;
  type: string; // ru аспект
  typeKey: string;
  orb: number;
}

export interface NatalAngle {
  sign: string;
  signKey: string;
  degreeText: string;
  lon: number;
}

export interface NatalChart {
  meta: {
    name: string;
    gender: string | null;
    birthDate: string;
    birthTime: string | null;
    birthTimeKnown: boolean;
    lat: number;
    lon: number;
    timezone: string;
    system: "placidus";
    zodiac: "tropical";
    engine: "circular-natal-horoscope-js";
  };
  placements: NatalPlacement[];
  nodes: NatalPlacement[];
  ascendant: NatalAngle | null;
  midheaven: NatalAngle | null;
  houseCusps: number[]; // 12 абс. долгот куспидов (или [] без времени)
  houses: { house: number; sign: string; degreeText: string }[];
  aspects: NatalAspect[];
  chartRuler: {
    key: string;
    label: string;
    sign: string;
    house: number | null;
    ascSign: string;
  } | null;
  lunarPhase: string;
  stelliums: { where: string; planets: string[] }[];
  hemispheres: {
    top: number;
    bottom: number;
    east: number;
    west: number;
    label: string;
  } | null;
  balance: {
    elements: Record<"fire" | "earth" | "air" | "water", number>;
    modalities: Record<"cardinal" | "fixed" | "mutable", number>;
    elementsPct: Record<"fire" | "earth" | "air" | "water", number>;
    modalitiesPct: Record<"cardinal" | "fixed" | "mutable", number>;
  };
}

export interface NatalResult {
  chart: NatalChart;
  summary: string;
  timezone: string;
}

function degText(ecl: { ArcDegrees: { degrees: number; minutes: number } }): string {
  const within = ecl.ArcDegrees.degrees % 30;
  return `${within}°${String(ecl.ArcDegrees.minutes).padStart(2, "0")}′`;
}
function degWithin(decimalDegrees: number): number {
  return Number((decimalDegrees % 30).toFixed(2));
}
function pct(part: Record<string, number>): Record<string, number> {
  const total = Object.values(part).reduce((s, n) => s + n, 0) || 1;
  const out: Record<string, number> = {};
  for (const k of Object.keys(part)) out[k] = Math.round((part[k] / total) * 100);
  return out;
}

export function computeNatalChart(input: NatalInput): NatalResult {
  const [y, m, d] = input.birthDate.split("-").map(Number);
  let hour = 12;
  let minute = 0;
  if (input.birthTimeKnown && input.birthTime) {
    const [hh, mm] = input.birthTime.split(":").map(Number);
    hour = hh;
    minute = mm;
  }

  const origin = new Origin({
    year: y,
    month: m - 1,
    date: d,
    hour,
    minute,
    latitude: input.lat,
    longitude: input.lon,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    language: "en",
  });

  const timezone: string =
    origin?.timezone?.name ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const withHouses = input.birthTimeKnown && !!input.birthTime;

  const bodyByKey: Record<string, unknown> = {};
  for (const b of horoscope.CelestialBodies.all) bodyByKey[b.key] = b;
  const pointByKey: Record<string, unknown> = {};
  for (const p of horoscope.CelestialPoints.all ?? []) pointByKey[p.key] = p;

  const toPlacement = (raw: {
    key: string;
    Sign: { key: string; label: string };
    House?: { id: number };
    ChartPosition: {
      Ecliptic: { DecimalDegrees: number; ArcDegrees: { degrees: number; minutes: number } };
    };
    isRetrograde?: boolean;
  }): NatalPlacement => {
    const dignity = dignityOf(raw.key, raw.Sign.key);
    return {
      key: raw.key,
      label: PLANET_RU[raw.key] ?? raw.key,
      sign: SIGN_RU[raw.Sign.key] ?? raw.Sign.label,
      signKey: raw.Sign.key,
      lon: Number(raw.ChartPosition.Ecliptic.DecimalDegrees.toFixed(3)),
      degree: degWithin(raw.ChartPosition.Ecliptic.DecimalDegrees),
      degreeText: degText(raw.ChartPosition.Ecliptic),
      house: withHouses && raw.House ? raw.House.id : null,
      retrograde: !!raw.isRetrograde,
      dignity,
      dignityLabel: dignity ? DIGNITY_RU[dignity] : null,
    };
  };

  const placements: NatalPlacement[] = BODY_ORDER.filter((k) => bodyByKey[k]).map(
    (k) => toPlacement(bodyByKey[k] as Parameters<typeof toPlacement>[0]),
  );
  const nodes: NatalPlacement[] = ["northnode", "southnode", "lilith"]
    .filter((k) => pointByKey[k])
    .map((k) => toPlacement(pointByKey[k] as Parameters<typeof toPlacement>[0]));

  const asAngle = (a: {
    Sign: { key: string; label: string };
    ChartPosition: {
      Ecliptic: { DecimalDegrees: number; ArcDegrees: { degrees: number; minutes: number } };
    };
  }): NatalAngle => ({
    sign: SIGN_RU[a.Sign.key] ?? a.Sign.label,
    signKey: a.Sign.key,
    degreeText: degText(a.ChartPosition.Ecliptic),
    lon: Number(a.ChartPosition.Ecliptic.DecimalDegrees.toFixed(3)),
  });

  const ascendant = withHouses ? asAngle(horoscope.Ascendant) : null;
  const midheaven = withHouses ? asAngle(horoscope.Midheaven) : null;

  const houseObjs: {
    id: number;
    Sign: { key: string; label: string };
    ChartPosition: {
      StartPosition: {
        Ecliptic: { DecimalDegrees: number; ArcDegrees: { degrees: number; minutes: number } };
      };
    };
  }[] = withHouses ? horoscope.Houses : [];

  const houseCusps = houseObjs.map((h) =>
    Number(h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees.toFixed(3)),
  );
  const houses = houseObjs.map((h) => ({
    house: h.id,
    sign: SIGN_RU[h.Sign.key] ?? h.Sign.label,
    degreeText: degText(h.ChartPosition.StartPosition.Ecliptic),
  }));

  // --- аспекты (только между планетами) ---
  const bodyKeySet = new Set(BODY_ORDER);
  const aspects: NatalAspect[] = (horoscope.Aspects.all as {
    point1Key: string;
    point2Key: string;
    aspectKey: string;
    orb: number;
  }[])
    .filter((a) => bodyKeySet.has(a.point1Key) && bodyKeySet.has(a.point2Key))
    .map((a) => ({
      a: PLANET_RU[a.point1Key] ?? a.point1Key,
      b: PLANET_RU[a.point2Key] ?? a.point2Key,
      aKey: a.point1Key,
      bKey: a.point2Key,
      type: ASPECT_RU[a.aspectKey] ?? a.aspectKey,
      typeKey: a.aspectKey,
      orb: Number(a.orb.toFixed(1)),
    }))
    .sort((x, z) => x.orb - z.orb);

  // --- баланс стихий/крестов ---
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 };
  const elementsW = { fire: 0, earth: 0, air: 0, water: 0 };
  const modalitiesW = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const p of placements) {
    if (!BALANCE_BODIES.includes(p.key)) continue;
    elements[ELEMENT_OF[p.signKey]]++;
    modalities[MODALITY_OF[p.signKey]]++;
    const w = WEIGHT[p.key] ?? 1;
    elementsW[ELEMENT_OF[p.signKey]] += w;
    modalitiesW[MODALITY_OF[p.signKey]] += w;
  }
  if (ascendant) {
    elementsW[ELEMENT_OF[ascendant.signKey]] += 3;
    modalitiesW[MODALITY_OF[ascendant.signKey]] += 3;
  }

  // --- управитель карты ---
  let chartRuler: NatalChart["chartRuler"] = null;
  if (ascendant) {
    const rulerKey = RULER_OF[ascendant.signKey];
    const rp = placements.find((p) => p.key === rulerKey);
    if (rp) {
      chartRuler = {
        key: rp.key,
        label: rp.label,
        sign: rp.sign,
        house: rp.house,
        ascSign: ascendant.sign,
      };
    }
  }

  // --- фаза Луны ---
  const sun = placements.find((p) => p.key === "sun");
  const moon = placements.find((p) => p.key === "moon");
  let lunarPhase = "—";
  if (sun && moon) {
    const sep = (((moon.lon - sun.lon) % 360) + 360) % 360;
    lunarPhase = [
      "Новолуние", "Растущий серп", "Первая четверть", "Растущая Луна",
      "Полнолуние", "Убывающая Луна", "Последняя четверть", "Убывающий серп",
    ][Math.floor(sep / 45)];
  }

  // --- стеллиумы (3+ планеты в одном знаке; из 10 планет) ---
  const bySign: Record<string, string[]> = {};
  for (const p of placements) {
    if (!BALANCE_BODIES.includes(p.key)) continue;
    (bySign[p.sign] ??= []).push(p.label);
  }
  const stelliums = Object.entries(bySign)
    .filter(([, list]) => list.length >= 3)
    .map(([where, list]) => ({ where, planets: list }));

  // --- полусферы (по домам, из 10 планет) ---
  let hemispheres: NatalChart["hemispheres"] = null;
  if (withHouses) {
    let top = 0, bottom = 0, east = 0, west = 0;
    for (const p of placements) {
      if (!BALANCE_BODIES.includes(p.key) || !p.house) continue;
      if (p.house >= 7) top++;
      else bottom++;
      if ([10, 11, 12, 1, 2, 3].includes(p.house)) east++;
      else west++;
    }
    const parts: string[] = [];
    if (top >= 6) parts.push("верхняя полусфера (внешний мир, публичность)");
    else if (bottom >= 6) parts.push("нижняя полусфера (внутренний мир, личное)");
    if (east >= 6) parts.push("восточная сторона (самостоятельность, инициатива)");
    else if (west >= 6) parts.push("западная сторона (зависимость от других, отклик)");
    hemispheres = {
      top,
      bottom,
      east,
      west,
      label: parts.length ? `Акцент: ${parts.join("; ")}` : "Планеты распределены равномерно",
    };
  }

  const chart: NatalChart = {
    meta: {
      name: input.name,
      gender: input.gender ?? null,
      birthDate: input.birthDate,
      birthTime: input.birthTimeKnown ? input.birthTime : null,
      birthTimeKnown: input.birthTimeKnown,
      lat: input.lat,
      lon: input.lon,
      timezone,
      system: "placidus",
      zodiac: "tropical",
      engine: "circular-natal-horoscope-js",
    },
    placements,
    nodes,
    ascendant,
    midheaven,
    houseCusps,
    houses,
    aspects,
    chartRuler,
    lunarPhase,
    stelliums,
    hemispheres,
    balance: {
      elements,
      modalities,
      elementsPct: pct(elementsW) as NatalChart["balance"]["elementsPct"],
      modalitiesPct: pct(modalitiesW) as NatalChart["balance"]["modalitiesPct"],
    },
  };

  return { chart, summary: buildSummary(chart), timezone };
}

/** Плотная текстовая карта для подмешивания в промпты AI-таролога. */
export function buildSummary(c: NatalChart): string {
  const planetLine = c.placements
    .map((p) => {
      const house = p.house ? `, ${p.house} дом` : "";
      const retro = p.retrograde ? ", R" : "";
      const dig = p.dignityLabel ? `, ${p.dignityLabel}` : "";
      return `${p.label} — ${p.sign} ${p.degreeText}${house}${retro}${dig}`;
    })
    .join(". ");

  const nodeLine = c.nodes.map((p) => `${p.label} — ${p.sign} ${p.degreeText}`).join(". ");

  const angleLine =
    c.ascendant && c.midheaven
      ? `Асцендент — ${c.ascendant.sign} ${c.ascendant.degreeText}. MC — ${c.midheaven.sign} ${c.midheaven.degreeText}.`
      : "Время рождения не указано: дома, Асцендент и MC не рассчитаны, положение Луны приблизительное.";

  const rulerLine = c.chartRuler
    ? `Управитель карты — ${c.chartRuler.label} (управитель ${c.chartRuler.ascSign}), стоит в ${c.chartRuler.sign}${c.chartRuler.house ? `, ${c.chartRuler.house} дом` : ""}.`
    : "";

  const ep = c.balance.elementsPct;
  const mp = c.balance.modalitiesPct;
  const balanceLine = `Стихии: огонь ${ep.fire}%, земля ${ep.earth}%, воздух ${ep.air}%, вода ${ep.water}%. Кресты: кардинальный ${mp.cardinal}%, фиксированный ${mp.fixed}%, мутабельный ${mp.mutable}%.`;

  const phaseLine = c.lunarPhase !== "—" ? `Фаза Луны при рождении: ${c.lunarPhase}.` : "";

  const stelLine = c.stelliums.length
    ? "Стеллиум: " +
      c.stelliums.map((s) => `${s.planets.join(", ")} в ${s.where}`).join("; ") +
      "."
    : "";

  const hemiLine = c.hemispheres ? c.hemispheres.label + "." : "";

  const aspectLine = c.aspects.length
    ? "Ключевые аспекты: " +
      c.aspects
        .slice(0, 10)
        .map((a) => `${a.a} ${a.type} ${a.b} (орб ${a.orb}°)`)
        .join(", ") +
      "."
    : "";

  const who = [
    c.meta.name,
    c.meta.gender === "female" ? "жен." : c.meta.gender === "male" ? "муж." : null,
    `род. ${c.meta.birthDate}${c.meta.birthTime ? ` ${c.meta.birthTime}` : ""}`,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `Натальная карта (${who}; тропический зодиак, дома Placidus).`,
    `${planetLine}. ${nodeLine}.`,
    angleLine,
    rulerLine,
    balanceLine,
    phaseLine,
    stelLine,
    hemiLine,
    aspectLine,
  ]
    .filter(Boolean)
    .join("\n");
}
