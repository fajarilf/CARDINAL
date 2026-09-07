import type { ComponentPropsWithRef, ReactNode } from "react";

const INPUT_CLASS =
  "font-mono text-[13px] text-ink bg-paper border-[1.5px] border-ink/22 rounded-[2px] px-[11px] py-[9px] w-full transition-[border-color,box-shadow] duration-[140ms] placeholder:text-ink/22 focus:outline-none focus:border-clay focus:shadow-[0_0_0_3px_rgb(177_116_87/0.14)] motion-reduce:transition-none";

const LABEL_CLASS = "font-mono text-[11px] text-ink/55 tracking-[0.03em]";

export function Input({
  className = "",
  ...rest
}: ComponentPropsWithRef<"input">) {
  return <input className={`${INPUT_CLASS} ${className}`} {...rest} />;
}

export function Field({
  label,
  children,
  error,
  hint,
  grow,
}: {
  label: string;
  children: ReactNode;
  error?: boolean;
  hint?: string;
  grow?: boolean;
}) {
  return (
    <label
      className={"flex flex-col gap-1.5" + (grow ? " flex-1 min-w-0" : "")}
    >
      <span className={LABEL_CLASS}>
        {label}
        {error && <span className="text-clay"> — required</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11.5px] text-ink/55">{hint}</span>
      )}
    </label>
  );
}

export { LABEL_CLASS };
