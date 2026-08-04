import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/lib/navigation";

export function DocumentalQuickActions({
  actions,
  className,
}: {
  actions: QuickAction[];
  className?: string;
}) {
  if (actions.length === 0) return null;

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4 ring-soft", className)}
      aria-label="Atalhos rápidos"
    >
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[color:var(--warning)]" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Atalhos rápidos</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              to={action.to}
              search={action.search}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-lg border border-border/80 bg-background/80 px-3 py-3",
                "hover:border-primary/40 hover:bg-accent/40 transition-colors motion-safe:duration-150",
              )}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-primary group-hover:bg-primary/10">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-foreground leading-tight">
                {action.label}
              </span>
              {action.description ? (
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {action.description}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
