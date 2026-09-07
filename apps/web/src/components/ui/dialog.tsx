"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Full-screen dim + centering. Backdrop click and Escape both call onDismiss.
 */
export function Overlay({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 bg-ink/34 grid place-items-center p-5 z-40 [animation:cdFade_0.16s_ease_both] motion-reduce:animate-none"
      onMouseDown={onDismiss}
    >
      {children}
    </div>
  );
}

/**
 * The bordered paper card inside an Overlay. Stops mousedown so clicks inside
 * don't dismiss.
 */
export function DialogPanel({
  className = "",
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`w-full bg-paper border-[1.5px] border-ink rounded-[4px] shadow-modal animate-pop motion-reduce:animate-none ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      {...rest}
    >
      {children}
    </div>
  );
}
