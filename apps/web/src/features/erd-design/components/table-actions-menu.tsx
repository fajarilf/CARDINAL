import { useEffect, useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui";

export function TableActionsMenu({
  onOpen,
  onEdit,
  onDelete,
}: {
  onOpen?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton
        // the node header starts an entity drag on mousedown — stop that
        // before the click ever fires, so opening the menu never drags/deselects
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) onOpen?.();
        }}
        className="!w-6 !h-6"
        aria-label="Table actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Table actions"
      >
        <MoreVertical size={14} strokeWidth={1.9} />
      </IconButton>
      {open && (
        <div
          role="menu"
          // also inside the draggable node header — stop mousedown so picking
          // an item never starts an entity drag first
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1 z-30 w-[150px] py-1 bg-paper border-[1.5px] border-ink rounded-[2px] shadow-[2px_2px_0_var(--color-ink)]"
        >
          <button
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-[7px] text-[13px] text-ink hover:bg-taupe cursor-pointer"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={14} strokeWidth={1.9} /> Edit table
          </button>
          <button
            role="menuitem"
            className="w-full flex items-center gap-2 px-3 py-[7px] text-[13px] text-clay hover:bg-taupe cursor-pointer"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={14} strokeWidth={1.9} /> Delete table
          </button>
        </div>
      )}
    </div>
  );
}
