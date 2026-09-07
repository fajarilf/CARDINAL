import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { CrowsFoot } from "@/components/crows-foot";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-[1.5px] border-dashed border-ink/22 rounded-[4px] px-6 py-14 text-center flex flex-col items-center">
      <span className="text-clay mb-2" aria-hidden="true">
        <CrowsFoot size={44} strokeWidth={1.4} />
      </span>
      <h2 className="text-[22px] font-bold my-1.5">No databases linked yet</h2>
      <p className="max-w-[44ch] mb-[22px] text-ink/55 leading-[1.55]">
        Connect a MySQL or PostgreSQL database and CARDINAL introspects the
        schema into a diagram.
      </p>
      <Button onClick={onAdd}>
        <Plus size={17} strokeWidth={2.2} />
        New connection
      </Button>
    </div>
  );
}
