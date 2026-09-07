import { Loader2 } from "lucide-react";

export function Spinner({ size = 15 }: { size?: number }) {
  return (
    <Loader2 size={size} className="animate-spin-slow motion-reduce:animate-none" />
  );
}
