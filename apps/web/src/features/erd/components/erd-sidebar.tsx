import type { ReactNode } from "react";
import { Search, Link2, X } from "lucide-react";
import { Input, IconButton } from "@/components/ui";
import type { ErdEdge, ErdTable } from "../api/types";

export function ErdSidebar({
  tables,
  edges,
  selected,
  relCount,
  query,
  onQuery,
  onPick,
  headerAction,
}: {
  tables: ErdTable[];
  edges: ErdEdge[];
  selected: string | null;
  relCount: number;
  query: string;
  onQuery: (v: string) => void;
  onPick: (table: ErdTable) => void;
  headerAction?: ReactNode;
}) {
  const q = query.toLowerCase().trim();
  const filtered = tables.filter((t) => t.name.toLowerCase().includes(q));

  return (
    <aside className="w-[250px] h-full shrink-0 border-r-[1.5px] border-ink flex flex-col bg-paper">
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold">Tables</span>
          <span className="font-mono text-xs text-ink/55">{tables.length}</span>
        </div>
        {headerAction}
      </div>

      <div className="relative mx-3.5 mb-2 flex items-center">
        <Search size={14} className="absolute left-[9px] text-ink/55" />
        <Input
          className="pl-[29px] pr-8 py-[7px] text-[12.5px]"
          placeholder="Filter tables"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <IconButton
            className="!w-5 !h-5 absolute right-1.5"
            onClick={() => onQuery("")}
            aria-label="Clear"
          >
            <X size={13} />
          </IconButton>
        )}
      </div>

      <ul className="list-none m-0 px-2 py-1 overflow-y-auto flex-1">
        {filtered.length === 0 && (
          <li className="text-[13px] text-ink/55 px-2 py-3 italic">No tables match.</li>
        )}
        {filtered.map((t) => {
          const rels = edges.filter(
            (e) => e.from.table === t.id || e.to.table === t.id,
          ).length;
          return (
            <li key={t.id}>
              <button
                className={
                  "w-full flex items-center justify-between gap-2 px-[9px] py-2 border-[1.5px] rounded-[2px] text-left transition-colors duration-100 motion-reduce:transition-none cursor-pointer " +
                  (selected === t.id
                    ? "bg-clay/[0.14] border-clay"
                    : "bg-transparent border-transparent hover:bg-taupe")
                }
                onClick={() => onPick(t)}
              >
                <span className="font-mono text-[13px] font-medium text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.name}
                </span>
                <span className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-ink/55">
                  {t.columns.length} cols
                  {rels > 0 && (
                    <span className="inline-flex items-center gap-[3px] text-clay">
                      <Link2 size={11} />
                      {rels}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t-[1.5px] border-ink/14 px-4 py-3 min-h-[64px]">
        {selected ? (
          <>
            <div className="flex items-center justify-between font-mono text-xs text-ink/55 py-0.5">
              <span>selected</span>
              <b className="text-ink font-semibold">{selected}</b>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-ink/55 py-0.5">
              <span>relationships</span>
              <b className="text-ink font-semibold">{relCount}</b>
            </div>
          </>
        ) : (
          <p className="m-0 text-xs leading-[1.5] text-ink/55">
            Click a table to trace its relationships, or drag entities to lay out
            the diagram.
          </p>
        )}
      </div>
    </aside>
  );
}
