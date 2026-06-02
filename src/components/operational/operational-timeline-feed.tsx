import { useMemo, useState } from "react";
import { History } from "lucide-react";
import type { OperationalEntityType, OperationalEventSeverity } from "@/lib/database.types";
import { useOperationalTimelineInfinite } from "@/hooks/use-operational-timeline";
import {
  OPERATIONAL_ENTITY_TYPES,
  OPERATIONAL_EVENT_SEVERITIES,
} from "@/lib/operations/timeline/event-registry";
import type { TimelineScope } from "@/lib/operations/timeline";
import type { OperationalEventRow } from "@/lib/services/operations/operational-event-queries";
import { EmptyState, ErrorState, SkeletonRow } from "@/components/ui-kit";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function severityBadgeClass(sev: OperationalEventSeverity): string {
  if (sev === "critical") return "bg-destructive/15 text-destructive ring-1 ring-destructive/25";
  if (sev === "warning")
    return "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25";
  return "bg-muted text-muted-foreground ring-1 ring-border/80";
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function TimelineCard({ row }: { row: OperationalEventRow }) {
  return (
    <li className="px-4 py-3.5 flex flex-col gap-1.5 border-b border-border/80 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            severityBadgeClass(row.severity),
          )}
        >
          {row.severity}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatWhen(row.created_at)}
        </span>
      </div>
      <p className="text-sm text-foreground leading-snug">{row.description || row.event_type}</p>
      <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono">{row.event_type}</span>
        <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono">
          {row.entity_type}:
          {row.entity_id.length > 14 ? `${row.entity_id.slice(0, 10)}…` : row.entity_id}
        </span>
      </div>
    </li>
  );
}

export function OperationalTimelineFeed(props: { scope?: TimelineScope; className?: string }) {
  const scope = props.scope ?? { kind: "global" as const };
  const [severity, setSeverity] = useState<OperationalEventSeverity | "all">("all");
  const [entityType, setEntityType] = useState<OperationalEntityType | "all">("all");

  const q = useOperationalTimelineInfinite({
    scope,
    limit: 25,
    severity: severity === "all" ? undefined : severity,
    entityType: entityType === "all" ? undefined : entityType,
  });

  const rows = useMemo(() => q.data?.pages.flatMap((p) => p.rows) ?? [], [q.data?.pages]);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/10 overflow-hidden flex flex-col min-h-[200px]",
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/80 bg-background/40">
        <div className="flex items-center gap-2 min-w-0">
          <History className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              Histórico operacional
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Audit trail · atualização em tempo real
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
            Sev.
            <select
              className="rounded-md border border-border bg-background text-[11px] px-2 py-1 font-normal normal-case"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as OperationalEventSeverity | "all")}
            >
              <option value="all">Todas</option>
              {OPERATIONAL_EVENT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
            Entidade
            <select
              className="rounded-md border border-border bg-background text-[11px] px-2 py-1 font-normal normal-case max-w-[140px]"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as OperationalEntityType | "all")}
            >
              <option value="all">Todas</option>
              {OPERATIONAL_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {q.isLoading ? (
        <div className="p-4 space-y-2">
          <SkeletonRow height={56} />
          <SkeletonRow height={56} />
          <SkeletonRow height={56} />
        </div>
      ) : q.isError ? (
        <div className="p-4">
          <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Nenhum evento ainda"
            description="Ações de plantões, trocas e disponibilidade aparecerão aqui automaticamente."
          />
        </div>
      ) : (
        <>
          <ul className="max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain">
            {rows.map((row) => (
              <TimelineCard key={row.id} row={row} />
            ))}
          </ul>
          {q.hasNextPage ? (
            <div className="p-3 border-t border-border/80 flex justify-center bg-background/30">
              <button
                type="button"
                className="text-xs rounded-lg border border-border bg-background px-3 py-1.5 font-medium hover:bg-accent/60 disabled:opacity-50"
                disabled={q.isFetchingNextPage}
                onClick={() => void q.fetchNextPage()}
              >
                {q.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
