import type { ReactNode } from "react";
import { Trash2, Link2 } from "lucide-react";
import { ErdSidebar } from "@/features/erd";
import { IconButton } from "@/components/ui";
import type { DesignSelection, ErdEdge, ErdTable } from "../api/types";

export function DesignSidebar({
  tables,
  edges,
  selection,
  query,
  onQuery,
  onPick,
  onDeleteEdge,
  headerAction,
}: {
  tables: ErdTable[];
  edges: ErdEdge[];
  selection: DesignSelection;
  query: string;
  onQuery: (v: string) => void;
  onPick: (table: ErdTable) => void;
  onDeleteEdge: () => void;
  headerAction?: ReactNode;
}) {
  const selectedTableId = selection?.kind === "table" ? selection.id : null;
  const selectedEdge =
    selection?.kind === "edge" ? edges.find((e) => e.id === selection.id) : undefined;
  const relCount = selectedTableId
    ? edges.filter((e) => e.from.table === selectedTableId || e.to.table === selectedTableId)
        .length
    : 0;

  let footer: ReactNode;
  if (selectedTableId) {
    const table = tables.find((t) => t.id === selectedTableId);
    footer = (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between font-mono text-xs text-ink/55">
          <span>selected</span>
          <b className="text-ink font-semibold truncate max-w-[140px]">
            {table?.name ?? selectedTableId}
          </b>
        </div>
        <div className="flex items-center justify-between font-mono text-xs text-ink/55">
          <span>relationships</span>
          <b className="text-ink font-semibold">{relCount}</b>
        </div>
      </div>
    );
  } else if (selectedEdge) {
    footer = (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-mono text-xs text-ink">
          <Link2 size={12} className="text-clay shrink-0" />
          <span className="truncate">
            {selectedEdge.from.table}.{selectedEdge.from.col} → {selectedEdge.to.table}.
            {selectedEdge.to.col}
          </span>
        </div>
        <IconButton
          tone="danger"
          onClick={onDeleteEdge}
          aria-label="Delete relationship"
          title="Delete"
          className="self-start"
        >
          <Trash2 size={14} strokeWidth={1.9} />
        </IconButton>
      </div>
    );
  } else {
    footer = (
      <p className="m-0 text-xs leading-[1.5] text-ink/55">
        Click a table to edit it, drag from a column&rsquo;s dot to draw a
        relationship, or click a relationship line to select and delete it.
      </p>
    );
  }

  return (
    <ErdSidebar
      tables={tables}
      edges={edges}
      selected={selectedTableId}
      relCount={relCount}
      query={query}
      onQuery={onQuery}
      onPick={onPick}
      headerAction={headerAction}
      footer={footer}
    />
  );
}
