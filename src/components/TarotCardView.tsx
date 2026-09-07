"use client";

import Image from "next/image";
import type { TarotCard } from "@/data/cards";

interface TarotCardViewProps {
  card: TarotCard | null;
  faceUp: boolean;
  reversed?: boolean;
  onClick?: () => void;
  width?: number;
  disabled?: boolean;
}

export default function TarotCardView({
  card,
  faceUp,
  reversed = false,
  onClick,
  width = 120,
  disabled = false,
}: TarotCardViewProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`card-flip select-none ${onClick ? "deck-card" : ""}`}
      style={{ width, aspectRatio: "500 / 878", cursor: onClick ? "pointer" : "default" }}
    >
      <div className={`card-flip-inner ${faceUp ? "is-flipped" : ""}`}>
        <div className="card-face card-face-front card-back-pattern" />
        <div
          className="card-face card-face-back bg-[#f4efe3] shadow-lg"
          style={{ transform: `rotateY(180deg) ${reversed ? "rotate(180deg)" : ""}` }}
        >
          {card && (
            <Image
              src={card.image}
              alt={card.name}
              fill
              sizes={`${width}px`}
              className="object-contain p-1"
              priority={false}
            />
          )}
        </div>
      </div>
    </button>
  );
}
