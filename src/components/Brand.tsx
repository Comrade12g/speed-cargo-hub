import { ShipWheel } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return <div className={cn("flex items-center gap-3 font-extrabold tracking-tight", light ? "text-white" : "text-[#062542]")}>
    <span className="grid size-10 place-items-center rounded-lg bg-white text-[#ed1c2a] shadow-sm"><ShipWheel className="size-6" /></span>
    {!compact && <div className="leading-none"><div className="text-xl">Speed Cargo</div><div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#ed1c2a]">Ghana</div></div>}
  </div>;
}
