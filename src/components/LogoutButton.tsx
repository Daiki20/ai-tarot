"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.push("/");
        router.refresh();
      }}
      className="btn-ghost rounded-full px-4 py-1.5 text-sm"
    >
      Выйти
    </button>
  );
}
