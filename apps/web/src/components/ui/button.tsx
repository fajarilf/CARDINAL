import type { ComponentPropsWithRef, ReactNode } from "react";
import { Spinner } from "./spinner";

const BASE =
  "inline-flex items-center gap-[7px] font-semibold text-sm rounded-[2px] px-[15px] py-[9px] border-[1.5px] border-ink transition-[transform,box-shadow,background] duration-150 cursor-pointer motion-reduce:transition-none";

const VARIANT = {
  primary:
    "bg-clay text-paper shadow-brutal hover:-translate-x-px hover:-translate-y-px hover:shadow-brutal-lg active:translate-x-px active:translate-y-px active:shadow-brutal-sm",
  ghost:
    "bg-transparent text-ink hover:bg-taupe disabled:opacity-50 disabled:cursor-default",
  quiet:
    "bg-transparent border-transparent text-ink/55 hover:text-ink hover:bg-taupe",
  danger:
    "bg-ink text-paper shadow-clay-btn hover:-translate-x-px hover:-translate-y-px hover:shadow-clay",
} as const;

type Variant = keyof typeof VARIANT;

export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ComponentPropsWithRef<"button"> & {
  variant?: Variant;
  loading?: boolean;
}) {
  return (
    <button
      className={`${BASE} ${VARIANT[variant]} ${className}`}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

const ICON_BASE =
  "grid place-items-center w-[31px] h-[31px] bg-transparent border border-transparent rounded-[2px] text-ink/55 transition-colors duration-[140ms] cursor-pointer motion-reduce:transition-none";

const ICON_TONE = {
  default: "hover:text-ink hover:bg-taupe hover:border-ink/22",
  danger: "hover:text-clay hover:bg-clay/[0.14] hover:border-transparent",
} as const;

export function IconButton({
  tone = "default",
  children,
  className = "",
  ...rest
}: ComponentPropsWithRef<"button"> & {
  tone?: keyof typeof ICON_TONE;
  children: ReactNode;
}) {
  return (
    <button
      className={`${ICON_BASE} ${ICON_TONE[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
