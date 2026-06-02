import { Link } from "@tanstack/react-router";
import { ArrowRight, Zap } from "lucide-react";
import { useMemo } from "react";
import { appendOperationalTimelineObservationFn } from "@/lib/operations/api";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import { deriveOperationalQuickActions, operationalLinkProps } from "@/lib/operations/actions";
import { cn } from "@/lib/utils";

export function OperationalQuickActions(props: {
  alerts: OperationalAlert[];
  snapshot: OperationalCommandCenterSnapshot | undefined;
  className?: string;
  /** Quando true, atalhos derivados de alertas geram evento `operational_action_triggered` na timeline. */
  canRecordAudit?: boolean;
}) {
  const { alerts, snapshot, className, canRecordAudit } = props;
  const actions = useMemo(
    () => deriveOperationalQuickActions(alerts, snapshot),
    [alerts, snapshot],
  );

  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 flex flex-wrap items-center gap-2",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
        <Zap className="h-3 w-3 text-[color:var(--warning)]" />
        Atalhos
      </span>
      <div className="flex flex-wrap gap-1.5 min-w-0">
        {actions.map((a) => (
          <Link
            key={a.key}
            {...operationalLinkProps(a.target)}
            onClick={() => {
              if (!canRecordAudit || !a.sourceAlertId) return;
              void appendOperationalTimelineObservationFn({
                data: {
                  eventType: "operational_action_triggered",
                  entityId: a.key,
                  description: `Atalho operacional: ${a.label}`,
                  metadata: {
                    source_alert_id: a.sourceAlertId,
                    route: a.target,
                  },
                },
              }).catch(() => undefined);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border/90 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm",
              "hover:bg-accent/70 hover:border-[color:var(--secondary)]/40 transition-colors",
              a.priority <= 1 && "ring-1 ring-[color:var(--warning)]/25",
            )}
          >
            {a.label}
            <ArrowRight className="h-3 w-3 opacity-60" />
          </Link>
        ))}
      </div>
    </div>
  );
}
