"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";

// Ссылка на действие, которое требует аккаунта. Гостю по клику показываем
// AuthGate вместо перехода. Авторизованному (или если gated=false) — обычный Link.
export default function GatedLink({
  href,
  authed,
  gated = true,
  className,
  style,
  children,
}: {
  href: string;
  authed: boolean;
  gated?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [showGate, setShowGate] = useState(false);

  if (authed || !gated) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGate(true)}
        className={`w-full text-left ${className ?? ""}`}
        style={style}
      >
        {children}
      </button>
      {showGate && (
        <AuthGate next={href} onClose={() => setShowGate(false)} />
      )}
    </>
  );
}
