import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tooltip padrão para superfícies de inteligência operacional. */
export const IA_TOOLTIP =
  "Recurso apoiado por Inteligência Artificial do MedicFlow-AI";

/** Badge compacto com ícone Brain — identidade visual global de IA. */
export function IaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-500/25 dark:text-violet-300",
        className,
      )}
      title={IA_TOOLTIP}
      aria-label={IA_TOOLTIP}
    >
      <Brain className="h-2.5 w-2.5" aria-hidden />
      IA
    </span>
  );
}
