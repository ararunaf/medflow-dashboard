/**
 * Cartões de contexto operacional semântico (fundação copiloto — determinístico).
 */
import { type ReactNode } from "react";
import { Brain, Fingerprint, Layers, Sparkles } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { useOperationalCopilotDerived } from "@/hooks/use-operational-copilot-derived";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { OperationalAlert } from "@/lib/operations/alerts/types";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function ContextMiniCard({
  title,
  lines,
  icon,
}: {
  title: string;
  lines: string[];
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex flex-col gap-2 min-h-[120px]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <ul className="text-xs text-foreground space-y-1.5 leading-snug list-disc pl-3.5">
        {lines.slice(0, 5).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function OperationalCopilotContextPanel(props: {
  snapshot: OperationalCommandCenterSnapshot | undefined;
  alerts: OperationalAlert[];
  isFetching: boolean;
  className?: string;
}) {
  const { canSee, derived, analyticsQuery } = useOperationalCopilotDerived({
    snapshot: props.snapshot,
    alerts: props.alerts,
  });

  if (!canSee) return null;

  if (!props.snapshot || !derived) return null;

  const { bundle, semantic, payload } = derived;

  return (
    <section
      id="ops-anchor-copilot-context"
      className={cn("scroll-mt-24", props.className)}
      aria-label="Contexto operacional semântico"
    >
      <OperationalLiveChrome
        isFetching={props.isFetching || analyticsQuery.isFetching}
        className="p-0 overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Contexto operacional (copiloto)
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Bundle determinístico · escopo{" "}
                {bundle.scope === "merged" ? "vivo + analytics" : "central ao vivo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <Fingerprint className="h-3 w-3" />
            {bundle.explainability.fingerprint}
          </div>
        </div>

        {analyticsQuery.isError ? (
          <p className="px-4 py-2 text-xs text-destructive">
            Analytics não anexado ao contexto: {describeError(analyticsQuery.error).message}
          </p>
        ) : null}

        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Brain className="h-3.5 w-3.5 text-primary" />
              Resumo para coordenação
            </div>
            <p className="text-sm font-medium text-foreground mt-1">
              {bundle.coordinatorSummary.headline}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {bundle.coordinatorSummary.subhead}
            </p>
            <ul className="mt-2 text-xs text-foreground space-y-1 list-disc pl-4">
              {bundle.coordinatorSummary.priorityLines.slice(0, 5).map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <ContextMiniCard
              title="Destaques semânticos"
              lines={semantic.semanticHighlights}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            />
            <ContextMiniCard
              title="Insights (payload)"
              lines={[payload.executiveSummary]}
              icon={<Layers className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {semantic.semanticTags.slice(0, 14).map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Proveniência: {bundle.explainability.sourceSummary.join(" · ")}
          </p>
        </div>
      </OperationalLiveChrome>
    </section>
  );
}
