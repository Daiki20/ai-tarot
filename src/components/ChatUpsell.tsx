import Price from "@/components/Price";

export default function ChatUpsell({
  price,
  onOpen,
}: {
  price: number;
  onOpen: () => void;
}) {
  return (
    <div
      className="mt-4 rounded-xl border border-[var(--gold-deep)] bg-[var(--ink-800)] p-6 sm:p-7 text-center"
      style={{
        backgroundImage:
          "linear-gradient(160deg, rgba(201,163,95,0.07), transparent 60%)",
        boxShadow: "inset 0 1px 0 rgba(227,200,143,0.12)",
      }}
    >
      <div className="flex justify-center mb-3 text-[var(--gold)]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <h3 className="font-display text-xl text-[var(--gold-soft)]">
        Остались вопросы по раскладу?
      </h3>
      <p className="mt-2 text-sm text-[var(--bone-dim)] max-w-md mx-auto leading-relaxed">
        Продолжите в диалоге с AI-тарологом — он помнит все ваши карты и
        толкование. Спрашивайте что угодно про эту ситуацию.
      </p>

      <button
        onClick={onOpen}
        className="btn-gold rounded-full px-7 py-3 text-sm mt-5 inline-flex items-center gap-1.5"
      >
        Открыть диалог · <Price amount={price} />
      </button>
      <p className="mt-2 text-xs text-[var(--muted)]">
        разовая оплата, без подписки
      </p>
    </div>
  );
}
