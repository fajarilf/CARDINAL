import type { ReactNode } from "react";

export function Toast({
  msg,
  icon,
}: {
  msg: string | null;
  icon?: ReactNode;
}) {
  return (
    <div
      className={
        "fixed left-1/2 bottom-[26px] -translate-x-1/2 flex items-center gap-2 font-mono text-[12.5px] text-paper bg-ink border-[1.5px] border-ink px-[15px] py-2.5 rounded-[3px] shadow-clay-btn transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 pointer-events-none motion-reduce:transition-none [&_svg]:text-clay " +
        (msg ? "translate-y-0" : "translate-y-[140%]")
      }
      role="status"
      aria-live="polite"
    >
      {msg && (
        <>
          {icon} {msg}
        </>
      )}
    </div>
  );
}
