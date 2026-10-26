import type { MouseEvent, ReactNode } from "react";
import { KeyRound } from "lucide-react";
import type { ErdTable } from "../api/types";
import { BOX_W, HEAD_H, ROW_H } from "../utils/geometry";

export function ErdNode({
  table,
  selected,
  dimmed,
  activeCols,
  onNodeDown,
  onHeadDown,
  onConnectStart,
  headerSlot,
}: {
  table: ErdTable;
  selected: boolean;
  dimmed: boolean;
  activeCols?: Set<string>;
  onNodeDown: (e: MouseEvent) => void;
  onHeadDown: (e: MouseEvent) => void;
  // design-mode only: renders a connector dot per row when provided
  onConnectStart?: (e: MouseEvent, columnName: string) => void;
  // design-mode only: renders next to the column count in the header when provided
  headerSlot?: ReactNode;
}) {
  return (
    <div
      className={
        "absolute bg-paper border-[1.5px] border-ink rounded-[3px] select-none transition-[opacity,box-shadow] duration-200 motion-reduce:transition-none " +
        (selected
          ? "shadow-clay z-[3] "
          : "shadow-soft ") +
        (dimmed ? "opacity-30" : "")
      }
      style={{ left: table.x, top: table.y, width: BOX_W }}
      onMouseDown={onNodeDown}
    >
      <div
        className="flex items-center justify-between px-3 bg-taupe border-b-[1.5px] border-ink rounded-t-[2px] cursor-grab active:cursor-grabbing"
        style={{ height: HEAD_H }}
        onMouseDown={onHeadDown}
      >
        <span className="font-bold text-[14px] tracking-[-0.01em]">{table.name}</span>
        <span className="flex items-center gap-1">
          <span className="font-mono text-[11px] text-ink/55">{table.columns.length}</span>
          {headerSlot}
        </span>
      </div>
      <div className="py-0.5">
        {table.columns.map((c) => (
          <div
            key={c.name}
            className={
              "relative flex items-center gap-2 pl-2.5 pr-3 border-b border-dashed border-ink/14 last:border-b-0 " +
              (activeCols?.has(c.name) ? "bg-clay/[0.14]" : "")
            }
            style={{ height: ROW_H }}
          >
            <span className="w-5 shrink-0 flex justify-center">
              {c.pk && (
                <span className="inline-flex items-center justify-center text-clay">
                  <KeyRound size={10} strokeWidth={2.4} />
                </span>
              )}
              {c.fk && !c.pk && (
                <span className="font-mono text-[8.5px] font-semibold text-ink/55 border border-ink/22 rounded-[2px] px-[3px] py-px leading-none">
                  FK
                </span>
              )}
            </span>
            <span
              className={
                "flex-1 font-mono text-[12.5px] text-ink whitespace-nowrap overflow-hidden text-ellipsis " +
                (c.pk ? "font-semibold" : "")
              }
            >
              {c.name}
            </span>
            <span className="font-mono text-[11px] text-ink/55 shrink-0">{c.type}</span>
            {onConnectStart && (
              <button
                type="button"
                className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-paper border border-ink/40 hover:bg-clay hover:border-clay cursor-crosshair"
                aria-label={`Connect ${c.name}`}
                title="Drag to connect"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart(e, c.name);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
