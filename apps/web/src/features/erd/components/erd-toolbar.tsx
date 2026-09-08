import { Plus, Minus, Maximize2, Download, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";

const TBTN =
  "inline-flex items-center gap-[5px] h-8 px-[9px] text-[13px] font-medium text-ink bg-paper hover:bg-taupe transition-colors duration-100 motion-reduce:transition-none cursor-pointer";
const TBTN_WIDE = TBTN + " border-[1.5px] border-ink/22 rounded-[2px]";

export function ErdToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onSync,
  onExport,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onSync: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border-[1.5px] border-ink/22 rounded-[2px] overflow-hidden">
        <button
          className={TBTN + " border-r border-ink/14"}
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
        <span className="font-mono text-xs min-w-[44px] text-center text-ink">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className={TBTN + " border-l border-ink/14"}
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
      </div>
      <button className={TBTN_WIDE} onClick={onFit}>
        <Maximize2 size={15} /> <span className="max-[720px]:hidden">Fit</span>
      </button>
      <button className={TBTN_WIDE} onClick={onSync}>
        <RotateCw size={15} /> <span className="max-[720px]:hidden">Sync</span>
      </button>
      <Button className="px-[14px] py-2" onClick={onExport}>
        <Download size={16} strokeWidth={2.1} /> Export
      </Button>
    </div>
  );
}
