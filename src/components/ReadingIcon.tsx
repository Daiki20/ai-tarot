// Единый набор линейных виньеток для карточек раскладов.
// stroke = currentColor, поэтому цвет задаётся родителем (золото / роза).

interface ReadingIconProps {
  id: string;
  className?: string;
}

const COMMON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.35,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const HEART =
  "M24 34C14 26 10 20.5 13.6 15.4C16.4 11.4 21.4 12.2 24 16.3C26.6 12.2 31.6 11.4 34.4 15.4C38 20.5 34 26 24 34Z";

function Glyph({ id }: { id: string }) {
  switch (id) {
    // Да / Нет — солнце и луна, двойственность ответа
    case "yes-no":
      return (
        <g {...COMMON}>
          <circle cx="18" cy="24" r="6" />
          <path d="M18 13v-3M18 38v-3M7 24H4M10.5 16.5l-2-2M10.5 31.5l-2 2" />
          <path d="M33 15a10 10 0 1 0 0 18a7.5 7.5 0 0 1 0-18Z" />
        </g>
      );
    // Карта дня — солнце
    case "sun":
      return (
        <g {...COMMON}>
          <circle cx="24" cy="24" r="7.5" />
          <path d="M24 9v-4M24 43v-4M9 24H5M43 24h-4M13.4 13.4l-2.8-2.8M37.4 37.4l-2.8-2.8M13.4 34.6l-2.8 2.8M37.4 10.6l-2.8 2.8" />
        </g>
      );
    // Матрица судьбы — октаграмма
    case "matrix":
      return (
        <g {...COMMON}>
          <rect x="12" y="12" width="24" height="24" />
          <rect x="12" y="12" width="24" height="24" transform="rotate(45 24 24)" />
          <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" />
        </g>
      );
    // Что он чувствует — сердце и двое
    case "feelings":
      return (
        <g {...COMMON}>
          <path d={HEART} />
          <circle cx="20.5" cy="20" r="2.1" />
          <circle cx="27.5" cy="20" r="2.1" />
        </g>
      );
    // Вернётся ли — разбитое сердце
    case "return":
      return (
        <g {...COMMON}>
          <path d={HEART} />
          <path d="M24 12.5l-3 6.5l4.5 3.5l-3.5 5l2 5" />
        </g>
      );
    // Будущее отношений — руки, оберегающие сердце
    case "relationship-future":
      return (
        <g {...COMMON}>
          <path d="M24 27c-3.4-3-5.2-5-3.4-7.6c1.4-2 3.4-1 3.4 1c0-2 2-3 3.4-1c1.8 2.6 0 4.6-3.4 7.6Z" />
          <path d="M13 18c-2.2 5.6 1.2 11.6 7 13" />
          <path d="M35 18c2.2 5.6-1.2 11.6-7 13" />
        </g>
      );
    // Прогноз на месяц — хрустальный шар
    case "month":
      return (
        <g {...COMMON}>
          <circle cx="24" cy="20" r="11" />
          <path d="M24 14.5l1.6 4.4l4.4 1.6l-4.4 1.6L24 26.5l-1.6-4.4L18 20.5l4.4-1.6Z" />
          <path d="M15 34h18M19 34l2-4M29 34l-2-4" />
        </g>
      );
    // Карьера и деньги — монета с рублём
    case "career":
      return (
        <g {...COMMON}>
          <circle cx="24" cy="19" r="10" />
          <path d="M21.5 13v12M21.5 13h3.8a3.8 3.8 0 0 1 0 7.6h-3.8M18.5 25h8" />
          <path d="M15 32h18M18 36h12" />
        </g>
      );
    // Полный расклад — веер из трёх карт
    case "full":
      return (
        <g {...COMMON}>
          <rect x="17" y="13" width="14" height="22" rx="2" transform="rotate(-14 24 24)" />
          <rect x="17" y="13" width="14" height="22" rx="2" transform="rotate(14 24 24)" />
          <rect x="17" y="12" width="14" height="22" rx="2" />
          <path d="M24 19l1.1 3l3 1.1l-3 1.1L24 27l-1.1-2.8l-3-1.1l3-1.1Z" />
        </g>
      );
    default:
      return (
        <g {...COMMON}>
          <circle cx="24" cy="24" r="11" />
        </g>
      );
  }
}

export default function ReadingIcon({ id, className }: ReadingIconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <Glyph id={id} />
    </svg>
  );
}
