/**
 * Painel de planejamento operacional estratégico supervisionado — readiness,
 * pressões projetadas e roadmaps explicáveis (sem execução automática).
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Gauge, Route, Shield, Sparkles } from "lucide-react";
import { OperationalLiveChrome } from "@/components/operational/operational-live-chrome";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  patchStrategicPlanningCycleLifecycleFn,
  runStrategicOperationalPlanningCycleFn,
} from "@/lib/operations/api/operational-strategic-planning";
import type { StrategicOperationalPlanningLayerSummary } from "@/lib/operations/strategic-planning/types";
import type { MutationResult } from "@/lib/server/fn-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const STATE_BADGE: Record<string, string> = {
  projected: "bg-muted text-muted-foreground ring-1 ring-border/80",
  analyzed: "bg-secondary/80 text-secondary-foreground",
  planned: "bg-primary/10 text-primary ring-1 ring-primary/20",
  supervised_review:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] ring-1 ring-[color:var(--warning)]/25",
  validated:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] ring-1 ring-[color:var(--success)]/25",
};

function stressTone(level: string): string {
  if (level === "high") return "text-destructive font-semibold";
  if (level === "moderate") return "text-[color:var(--warning)] font-medium";
  return "text-muted-foreground";
}

export function OperationalStrategicPlanningPanel(props: {
  layer: StrategicOperationalPlanningLayerSummary;
  canGovern: boolean;
  isFetching: boolean;
  orchestrationActiveCount: number;
  className?: string;
}) {
  const { layer, canGovern, isFetching, orchestrationActiveCount, className } = props;
  const qc = useQueryClient();
  const toastApi = useToast();

  const runCycle = useMutation({
    mutationFn: async () =>
      unwrap(
        (await runStrategicOperationalPlanningCycleFn()) as MutationResult<{
          cycleId: string;
          skippedDuplicate?: boolean;
        }>,
      ),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toastApi.success(
        data.skippedDuplicate ? "Ciclo já refletido" : "Ciclo de planejamento registrado",
        data.skippedDuplicate
          ? "Mesmo fingerprint nos últimos minutos — evitamos tempestade de replanejamento."
          : `Ciclo ${data.cycleId.slice(0, 8)}… persistido para revisão supervisionada.`,
      );
    },
    onError: (e: unknown) => {
      toastApi.error("Falha ao registrar ciclo", e instanceof Error ? e.message : String(e));
    },
  });

  const patchCycle = useMutation({
    mutationFn: async (input: {
      cycleId: string;
      nextLifecycleState: "supervised_review" | "validated";
    }) => unwrap(await patchStrategicPlanningCycleLifecycleFn({ data: input })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
      await qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      toastApi.success("Estado do ciclo atualizado", "Governança de planejamento salva.");
    },
    onError: (e: unknown) => {
      toastApi.error("Não foi possível atualizar", e instanceof Error ? e.message : String(e));
    },
  });

  if (!layer.enabled) {
    return (
      <OperationalLiveChrome
        isFetching={isFetching}
        className={cn("rounded-xl border border-border/80 bg-card/40 p-4", className)}
      >
        <div className="flex items-start gap-2">
          <Route className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Planejamento estratégico</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Disponível para coordenação e administradores do tenant.
            </p>
          </div>
        </div>
      </OperationalLiveChrome>
    );
  }

  const b = layer.liveBundle;
  const persisted = layer.persistedCycle;

  return (
    <OperationalLiveChrome
      isFetching={isFetching}
      className={cn("rounded-xl border border-border/80 bg-card/40 overflow-hidden", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground truncate">
              Planejamento estratégico supervisionado
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Orquestrações ativas: {orchestrationActiveCount} · snapshot{" "}
              {new Date(layer.asOf).toLocaleTimeString("pt-BR")}
            </p>
          </div>
        </div>
        {canGovern ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={runCycle.isPending}
            onClick={() => runCycle.mutate()}
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Registrar ciclo
          </Button>
        ) : null}
      </div>

      {!b ? (
        <p className="px-5 py-4 text-xs text-muted-foreground">Sem bundle ao vivo neste recorte.</p>
      ) : (
        <div className="px-5 py-4 space-y-5">
          <div className="rounded-lg border border-border/70 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Gauge className="h-3.5 w-3.5" aria-hidden />
              Readiness operacional
            </div>
            <p className="text-sm font-medium text-foreground mt-1">{b.readiness.headline}</p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {b.readiness.dimensions.slice(0, 6).map((d) => (
                <li key={d.code} className="flex justify-between gap-2">
                  <span className="truncate">{d.label}</span>
                  <span className="tabular-nums shrink-0">{(d.score * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Pressões projetadas</h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {b.stressProjections.map((s) => (
                <li
                  key={s.code}
                  className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-[11px]"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-foreground truncate">{s.label}</span>
                    <span className={cn("shrink-0 uppercase text-[10px]", stressTone(s.level))}>
                      {s.level}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-3">{s.rationale[0]}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 p-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" aria-hidden />
                Roadmap de mitigação
              </h3>
              <ul className="mt-2 space-y-2 text-[11px]">
                {b.outputs.mitigationRoadmap.phases.map((p) => (
                  <li key={p.ordinal} className="border-l-2 border-primary/30 pl-2">
                    <div className="font-medium text-foreground">{p.title}</div>
                    <ul className="list-disc ml-4 text-muted-foreground">
                      {p.actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                Governança preparada
              </h3>
              <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {b.governanceInsight.narrative.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {b.governance.planningBoundaries[0]}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border/80 p-3 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Raciocínio explicável: </span>
            {b.explainability.planningRationale.join(" ")}
          </div>

          {persisted && canGovern ? (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Ciclo persistido</span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    STATE_BADGE[persisted.lifecycleState] ?? STATE_BADGE.planned,
                  )}
                >
                  {persisted.lifecycleState}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {persisted.lifecycleState === "planned" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={patchCycle.isPending}
                    onClick={() =>
                      patchCycle.mutate({
                        cycleId: persisted.id,
                        nextLifecycleState: "supervised_review",
                      })
                    }
                  >
                    Enviar revisão
                  </Button>
                ) : null}
                {persisted.lifecycleState === "supervised_review" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={patchCycle.isPending}
                    onClick={() =>
                      patchCycle.mutate({ cycleId: persisted.id, nextLifecycleState: "validated" })
                    }
                  >
                    Validar ciclo
                  </Button>
                ) : null}
              </div>
            </div>
          ) : persisted ? (
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
              Último ciclo {persisted.id.slice(0, 8)}… · {persisted.lifecycleState}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
              Nenhum ciclo persistido ainda — use &quot;Registrar ciclo&quot; para auditoria.
            </p>
          )}
        </div>
      )}
    </OperationalLiveChrome>
  );
}
