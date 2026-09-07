"use client";

import { useState } from "react";
import TopupModal from "@/components/TopupModal";

export default function TopupButton({
  className = "btn-gold rounded-full px-6 py-2.5 text-sm",
  label = "Пополнить баланс",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && <TopupModal onClose={() => setOpen(false)} />}
    </>
  );
}
