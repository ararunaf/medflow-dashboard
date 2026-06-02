import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Contorno discreto para cards alimentados por TanStack Query + Realtime.
 * `isFetching` acende um traço lateral suave (sem polling — só refetch).
 */
export function OperationalLiveChrome({
  children,
  isFetching,
  critical,
  className,
}: {
  children: ReactNode;
  isFetching: boolean;
  critical?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card ring-soft transition-[box-shadow,background-color] duration-500",
        isFetching && "shadow-[inset_3px_0_0_0_var(--color-primary)] bg-primary/[0.02]",
        critical && "border-destructive/35 bg-destructive/[0.03]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Indicador “ao vivo” com pulso leve no ponto (não altera StatusBadge do kit). */
export function OperationalLivePulse({ label = "Tempo real" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/90" />
      </span>
      {label}
    </span>
  );
}
