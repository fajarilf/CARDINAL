export function ErdLegend() {
  return (
    <div className="absolute left-4 bottom-4 bg-paper border-[1.5px] border-ink rounded-[3px] shadow-[2.5px_2.5px_0_rgb(74_73_71/0.14)] px-3 py-[9px] flex flex-col gap-[5px]">
      <span className="font-mono text-[10px] text-ink/55 tracking-[0.05em] mb-px">
        cardinality
      </span>
      <div className="flex items-center gap-2 font-mono text-[11.5px] text-ink">
        <svg
          width="34"
          height="16"
          viewBox="0 0 34 16"
          className="stroke-ink [stroke-width:1.5] fill-none [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M2 8h20" />
          <path d="M8 3v10" />
        </svg>
        one
      </div>
      <div className="flex items-center gap-2 font-mono text-[11.5px] text-ink">
        <svg
          width="34"
          height="16"
          viewBox="0 0 34 16"
          className="stroke-ink [stroke-width:1.5] fill-none [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M2 8h20" />
          <path d="M22 8l10-5" />
          <path d="M22 8h10" />
          <path d="M22 8l10 5" />
        </svg>
        many
      </div>
    </div>
  );
}
