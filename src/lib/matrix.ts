import { getCardById, type TarotCard } from "@/data/cards";

function digitSum(n: number): number {
  return String(Math.abs(n))
    .split("")
    .reduce((s, d) => s + Number(d), 0);
}

// Свести число к диапазону старших арканов (1..22).
function reduceToArcana(n: number): number {
  while (n > 22) n = digitSum(n);
  return n;
}

// 22 = Шут (a-00), остальное 1..21 -> a-01..a-21.
function arcanaCard(n: number): TarotCard {
  const idx = n >= 22 ? 0 : n;
  return getCardById(`a-${String(idx).padStart(2, "0")}`)!;
}

export interface MatrixPoint {
  key: string;
  title: string;
  desc: string;
  arcana: TarotCard;
}

// dateStr — из <input type="date">, формат YYYY-MM-DD.
export function computeMatrix(dateStr: string): MatrixPoint[] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dayArc = reduceToArcana(day);
  const monthArc = reduceToArcana(month);
  const yearArc = reduceToArcana(digitSum(year));
  const destinyArc = reduceToArcana(dayArc + monthArc + yearArc);

  const raw: { key: string; title: string; desc: string; value: number }[] = [
    {
      key: "personality",
      title: "Портрет личности",
      desc: "Каким вас видят и как вы проявляетесь во внешнем мире.",
      value: dayArc,
    },
    {
      key: "resource",
      title: "Внутренний ресурс",
      desc: "Что питает вас и откуда вы черпаете силы.",
      value: monthArc,
    },
    {
      key: "ancestral",
      title: "Родовая программа",
      desc: "Что переходит к вам по роду — опора и задачи предков.",
      value: yearArc,
    },
    {
      key: "destiny",
      title: "Задача жизни",
      desc: "Главный урок и предназначение вашего пути.",
      value: destinyArc,
    },
  ];

  return raw.map((p) => ({
    key: p.key,
    title: p.title,
    desc: p.desc,
    arcana: arcanaCard(p.value),
  }));
}

// Дополнительные точки для полного разбора (за paywall).
export function computeMatrixExtras(dateStr: string): MatrixPoint[] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dayArc = reduceToArcana(day);
  const monthArc = reduceToArcana(month);
  const yearArc = reduceToArcana(digitSum(year));
  const destinyArc = reduceToArcana(dayArc + monthArc + yearArc);

  const raw: { key: string; title: string; desc: string; value: number }[] = [
    {
      key: "love",
      title: "Линия любви",
      desc: "Как вы строите близость и что ищете в партнёре.",
      value: reduceToArcana(dayArc + monthArc),
    },
    {
      key: "money",
      title: "Деньги и реализация",
      desc: "Через что к вам приходят достаток и признание.",
      value: reduceToArcana(monthArc + yearArc),
    },
    {
      key: "karma",
      title: "Кармический хвост",
      desc: "Что тянется из прошлого и просит проработки.",
      value: reduceToArcana(digitSum(Math.abs(dayArc - yearArc)) || 22),
    },
    {
      key: "talent",
      title: "Зона таланта",
      desc: "Где ваши силы раскрываются легче всего.",
      value: reduceToArcana(dayArc + destinyArc),
    },
  ];

  return raw.map((p) => ({
    key: p.key,
    title: p.title,
    desc: p.desc,
    arcana: arcanaCard(p.value),
  }));
}

// Все точки матрицы одним списком: 4 базовых + 4 расширенных. Порядок фиксирован —
// на него завязаны индексы в потоковом разборе AI.
export function computeFullMatrix(dateStr: string): MatrixPoint[] | null {
  const core = computeMatrix(dateStr);
  const extras = computeMatrixExtras(dateStr);
  if (!core || !extras) return null;
  return [...core, ...extras];
}
