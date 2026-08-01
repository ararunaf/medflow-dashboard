import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Brain, ClipboardList, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { IaBadge } from "@/components/operational/ia-badge";
import { SkeletonRow } from "@/components/ui-kit";
import { useOperationalActionProposalsQuery } from "@/hooks/use-operational-action-proposals";
import { useOperationalAlerts } from "@/hooks/use-operational-alerts";
import { useOperationalCommandCenterQuery } from "@/hooks/use-operational-metrics";
import type { OperationalActionProposalState } from "@/lib/database.types";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";

const PENDING_PROPOSAL_STATES: OperationalActionProposalState[] = [
  "suggested",
  "awaiting_confirmation",
  "draft",
];

export function OperationalIaHomeCard() {
  const cc = useOperationalCommandCenterQuery({ staleTime: 15_000 });
  const opsAlerts = useOperationalAlerts(cc.data);
  const proposals = useOperationalActionProposalsQuery({ enabled: true });

  const activeAlerts = opsAlerts.counts.critical + opsAlerts.counts.warning + opsAlerts.counts.info;
  const recommendations = cc.data?.recommendations.items.length ?? 0;
  const proposalRows = (proposals.data ?? []) as OperationalActionProposalDto[];
  const pendingProposals = proposalRows.filter((p) =>
    PENDING_PROPOSAL_STATES.includes(p.effectiveState),
  ).length;

  const loading = cc.isLoading || proposals.isLoading;

  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] via-card to-card ring-soft">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500/70 via-violet-400/50 to-violet-500/70"
        aria-hidden
      />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 pt-5">
        <div className="flex items-start gap-2 min-w-0">
          <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">IA Operacional</h2>
              <IaBadge />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sinais, recomendações e propostas supervisionadas em tempo real.
            </p>
          </div>
        </div>
        <Link
          to="/central"
          search={{ opsFocus: undefined }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
        >
          Abrir Central de IA
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="p-5">
          <SkeletonRow height={48} />
        </div>
      ) : (
        <div className="grid grid-cols-3 divide-x divide-border">
          <MetricCell
            icon={<Bell className="h-4 w-4 text-destructive/80" />}
            label="Alertas ativos"
            value={activeAlerts}
          />
          <MetricCell
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            label="Recomendações"
            value={recommendations}
          />
          <MetricCell
            icon={<ClipboardList className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
            label="Propostas pendentes"
            value={pendingProposals}
          />
        </div>
      )}
    </div>
  );
}

function MetricCell(props: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="px-4 py-4 text-center">
      <div className="flex justify-center mb-1.5">{props.icon}</div>
      <div className="text-xl font-semibold tabular-nums text-foreground">{props.value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{props.label}</div>
    </div>
  );
}
