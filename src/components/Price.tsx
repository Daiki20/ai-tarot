import AuraMark from "@/components/AuraMark";

// Цена в валюте aura (1 aura = 1 ₽). Число + значок.
export default function Price({
  amount,
  className,
  markClassName = "inline-block w-[0.9em] h-[0.9em]",
}: {
  amount: number;
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={className}>
      {amount.toLocaleString("ru-RU")}
      &nbsp;
      <AuraMark className={markClassName} />
    </span>
  );
}
