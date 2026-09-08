import Link from "next/link";
import { Pencil, Trash2, ArrowUpRight } from "lucide-react";
import { IconButton } from "@/components/ui";
import { CrowsFoot } from "@/components/crows-foot";
import { useToast } from "@/components/toast-provider";
import type { Connection, Engine } from "../api/types";

const ENGINE_LABEL: Record<Engine, string> = {
  postgresql: "postgres",
  mysql: "mysql",
};

export function ConnectionCard({
  conn,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  conn: Connection;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const rows: [string, string][] = [
    ["host", conn.host || "—"],
    ["database", conn.database || "—"],
    ["tables", conn.tables == null ? "—" : String(conn.tables)],
    ["synced", conn.lastSynced],
  ];

  return (
    <div
      className={
        "bg-paper border-[1.5px] border-ink rounded-[3px] overflow-hidden outline-none cursor-pointer transition-[box-shadow,transform] duration-150 motion-reduce:transition-none focus-visible:shadow-[0_0_0_3px_rgb(177_116_87/0.14)] " +
        (selected ? "shadow-clay hover:shadow-clay" : "hover:shadow-soft")
      }
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* entity header */}
      <div className="flex items-center justify-between gap-[10px] px-[14px] py-3 bg-taupe border-b-[1.5px] border-ink">
        <div className="flex items-center gap-[9px] min-w-0">
          <span className="font-bold text-[15.5px] tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis">
            {conn.name}
          </span>
          {conn.current && (
            <span
              className="inline-flex items-center gap-1 shrink-0 font-mono text-[10px] text-clay"
              title="Currently open diagram"
            >
              <CrowsFoot size={13} strokeWidth={2} /> current
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-[11px] font-medium text-ink px-[7px] py-0.5 border border-ink/22 rounded-[2px] bg-paper">
          {ENGINE_LABEL[conn.engine]}
        </span>
      </div>

      {/* attribute rows — reads like an ERD entity's fields */}
      <dl className="py-1">
        {rows.map(([k, v]) => (
          <div
            className="flex items-center justify-between gap-3 px-[14px] py-[7px] border-b border-dashed border-ink/14 last:border-b-0"
            key={k}
          >
            <dt className="font-mono text-[11px] text-ink/55 tracking-[0.02em]">
              {k}
            </dt>
            <dd className="font-mono text-[12.5px] text-ink whitespace-nowrap overflow-hidden text-ellipsis max-w-[60%] text-right">
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {/* action footer */}
      <div
        className="flex items-center justify-between gap-2 pt-[11px] pr-3 pb-[11px] pl-[14px] border-t-[1.5px] border-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/connections/${conn.id}/erd`}
          onClick={() => toast("Generating ERD…")}
          className="inline-flex items-center gap-[5px] font-semibold text-[13.5px] text-ink bg-transparent border-[1.5px] border-ink rounded-[2px] px-[13px] py-1.5 cursor-pointer transition-colors duration-[140ms] motion-reduce:transition-none hover:bg-clay hover:border-clay hover:text-paper"
        >
          Open <ArrowUpRight size={15} strokeWidth={2.2} />
        </Link>
        <div className="flex gap-1">
          <IconButton
            onClick={onEdit}
            aria-label={`Edit ${conn.name}`}
            title="Edit"
          >
            <Pencil size={15} strokeWidth={1.9} />
          </IconButton>
          <IconButton
            tone="danger"
            onClick={onDelete}
            aria-label={`Delete ${conn.name}`}
            title="Delete"
          >
            <Trash2 size={15} strokeWidth={1.9} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
