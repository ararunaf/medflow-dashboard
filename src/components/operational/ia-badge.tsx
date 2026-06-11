import { cn } from "@/lib/utils";

/** Badge compacto para superfícies de inteligência operacional. */
export function IaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 ring-1 ring-violet-500/25 dark:text-violet-300",
        className,
      )}
      aria-label="Inteligência artificial"
    >
      IA
    </span>
  );
}
