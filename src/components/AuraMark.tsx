// Значок валюты «aura» — гранёный ромб-искра. stroke = currentColor.

export default function AuraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: "-0.14em" }}
    >
      <path d="M12 2.5 20.5 12 12 21.5 3.5 12z" />
      <path d="M3.5 12h17M12 2.5 8 12l4 9.5M12 2.5l4 9.5-4 9.5" />
    </svg>
  );
}
