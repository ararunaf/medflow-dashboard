import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

/** Legenda discreta de descoberta — recursos apoiados por IA. */
export function IaLegend({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground",
        className,
      )}
    >
      <Brain className="h-3 w-3 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
      <span>Recursos identificados com este símbolo utilizam Inteligência Artificial.</span>
    </p>
  );
}
