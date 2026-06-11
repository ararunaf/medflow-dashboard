import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Info, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui-kit";
import { IaBadge } from "@/components/operational/ia-badge";
import { operationalLinkProps, primaryActionForAlertRuleId } from "@/lib/operations/actions";
import type { OperationalAlert, OperationalAlertSeverity } from "@/lib/operations/alerts/types";
import { cn } from "@/lib/utils";

function severityStyles(s: OperationalAlertSeverity): {
  icon: string;
  label: string;
} {
  if (s === "critical") {
    return {
      icon: "text-destructive",
      label: "Crítico",
    };
  }
  if (s === "warning") {
    return {
      icon: "text-[color:var(--warning)]",
      label: "Atenção",
    };
  }
  return {
    icon: "text-muted-foreground",
    label: "Info",
  };
}

function SeverityIcon({ s, className }: { s: OperationalAlertSeverity; className?: string }) {
  if (s === "critical") return <ShieldAlert className={cn("h-4 w-4", className)} />;
  if (s === "warning") return <AlertTriangle className={cn("h-4 w-4", className)} />;
  return <Info className={cn("h-4 w-4", className)} />;
}

function AlertContextualAction({ alert: a }: { alert: OperationalAlert }) {
  const act = primaryActionForAlertRuleId(a.id);
  if (!act) return null;
  return (
    <div className="mt-2.5">
      <Link
        {...operationalLinkProps(act.target)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
          a.severity === "critical" &&
            "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/15",
          a.severity === "warning" &&
            "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)] hover:bg-[color:var(--warning)]/15",
          a.severity === "info" && "border-border bg-muted/50 text-foreground hover:bg-muted",
        )}
      >
        {act.label}
      </Link>
    </div>
  );
}

export function OperationalAlertHeaderBadges(props: {
  counts: Record<OperationalAlertSeverity, number>;
  className?: string;
}) {
  const { counts, className } = props;
  const total = counts.critical + counts.warning + counts.info;
  if (total === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {counts.critical > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive ring-1 ring-destructive/20">
          {counts.critical} crít.
        </span>
      ) : null}
      {counts.warning > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--warning)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/20">
          {counts.warning} alerta{counts.warning === 1 ? "" : "s"}
        </span>
      ) : null}
      {counts.info > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {counts.info} info
        </span>
      ) : null}
    </div>
  );
}

export function OperationalAlertFeed({
  alerts,
  contextualActions = true,
}: {
  alerts: OperationalAlert[];
  contextualActions?: boolean;
}) {
  if (alerts.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          title="Operação supervisionada"
          description="Nenhum alerta operacional no momento — regras estão verdes para este snapshot."
        />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border max-h-[min(52vh,420px)] overflow-y-auto">
      {alerts.map((a) => {
        const st = severityStyles(a.severity);
        return (
          <li
            key={a.id}
            className={cn(
              "px-5 py-3.5 flex gap-3",
              a.severity === "critical" && "border-l-4 border-l-destructive bg-destructive/[0.03]",
              a.severity === "warning" &&
                "border-l-4 border-l-[color:var(--warning)] bg-[color:var(--warning)]/[0.04]",
              a.severity === "info" && "border-l-4 border-l-muted-foreground/40 bg-muted/15",
            )}
          >
            <div
              className={cn(
                "mt-0.5 shrink-0 rounded-md border border-border/80 bg-background/80 p-1.5",
                st.icon,
              )}
            >
              <SeverityIcon s={a.severity} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground leading-snug">
                  {a.title}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-semibold",
                    a.severity === "critical" && "text-destructive",
                    a.severity === "warning" && "text-[color:var(--warning)]",
                    a.severity === "info" && "text-muted-foreground",
                  )}
                >
                  {st.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
              {contextualActions ? <AlertContextualAction alert={a} /> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OperationalAlertFeedHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Bell className="h-4 w-4 text-muted-foreground" />
      <span>Alertas inteligentes</span>
      <IaBadge />
      {count > 0 ? (
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          ({count})
        </span>
      ) : null}
    </div>
  );
}
