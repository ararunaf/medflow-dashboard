/**
 * Hook raiz da camada realtime do MedFlow-IA.
 *
 * Responsabilidades:
 *  - Mantém subscriptions filtradas por `tenant_id` (shifts,
 *    shift_assignments, shift_swap_requests, availability, operational_events,
 *    operational_recommendation_feedback);
 *  - Mapeia cada evento Postgres para:
 *      a) invalidation TanStack Query nas `opsKeys` afetadas,
 *      b) toasts operacionais leves quando o evento é relevante ao
 *         usuário e NÃO foi disparado pelas próprias mutations;
 *  - Faz catch-up suave após reconexão (online / aba reaberta);
 *  - Limpa todas as subscriptions no unmount/logout.
 *
 * Por que um hook único?
 *  Conectar uma vez na raiz da árvore evita subscriptions duplicadas
 *  em rotas que entram/saem do DOM. O Realtime Manager por si só já
 *  é refcount-safe, mas centralizar reduz superfície e simplifica
 *  o raciocínio sobre quando `invalidateQueries` é disparado.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useMyContextQuery } from "@/hooks/use-operations";
import { opsKeys } from "@/lib/queries/keys";
import { onRealtimeReconnect, subscribe, teardownAllRealtime } from "@/lib/realtime/manager";
import { isSuppressed } from "@/lib/realtime/suppression";
import type { ChangeEvent } from "@/lib/realtime/types";
import { toast } from "@/lib/toast/bus";
import type { Database } from "@/lib/database.types";

type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
type SwapRow = Database["public"]["Tables"]["shift_swap_requests"]["Row"];

export function useOperationalRealtime(): void {
  const qc = useQueryClient();
  const me = useMyContextQuery({ refetchOnWindowFocus: false });

  const tenantId = me.data?.tenant.id ?? null;
  const professionalId = me.data?.professionalId ?? null;

  useEffect(() => {
    if (!tenantId) return;

    const unsubs: Array<() => void> = [];

    // ----------------------------------------------------------------
    // shifts
    unsubs.push(
      subscribe(
        { table: "shifts", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"shifts">) => {
          void qc.invalidateQueries({ queryKey: opsKeys.shifts() });
          void qc.invalidateQueries({ queryKey: opsKeys.dashboard() });
          void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
          void qc.invalidateQueries({ queryKey: opsKeys.operationalAnalytics() });

          const row = (evt.newRow ?? evt.oldRow) as ShiftRow | null;
          if (!row) return;
          if (isSuppressed("shifts", row.id)) return;

          if (evt.eventType === "INSERT") {
            toast.info("Novo plantão criado", "Confira na escala.", `shift-new-${row.id}`);
            return;
          }
          if (evt.eventType === "UPDATE") {
            const oldStatus = (evt.oldRow as ShiftRow | null)?.status;
            const newStatus = (evt.newRow as ShiftRow | null)?.status;
            if (oldStatus && newStatus && oldStatus !== newStatus) {
              if (newStatus === "cancelled") {
                toast.warning(
                  "Plantão cancelado",
                  "Verifique impactos na escala.",
                  `shift-cancel-${row.id}`,
                );
              } else if (newStatus === "assigned") {
                toast.info(
                  "Plantão atribuído",
                  "Uma escalação foi concluída.",
                  `shift-assigned-${row.id}`,
                );
              }
            }
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // shift_assignments
    unsubs.push(
      subscribe(
        { table: "shift_assignments", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"shift_assignments">) => {
          void qc.invalidateQueries({ queryKey: opsKeys.assignments() });
          void qc.invalidateQueries({ queryKey: opsKeys.shifts() });
          void qc.invalidateQueries({ queryKey: opsKeys.dashboard() });
          void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
          void qc.invalidateQueries({ queryKey: opsKeys.operationalAnalytics() });

          const row = (evt.newRow ?? evt.oldRow) as AssignmentRow | null;
          if (!row) return;
          if (isSuppressed("shift_assignments", row.id)) return;

          const isMine = professionalId && row.professional_id === professionalId;

          if (evt.eventType === "INSERT" && isMine) {
            toast.info(
              "Nova atribuição",
              "Você foi escalado para um plantão.",
              `assign-new-${row.id}`,
            );
            return;
          }
          if (evt.eventType === "UPDATE" && isMine) {
            const oldStatus = (evt.oldRow as AssignmentRow | null)?.assignment_status;
            const newStatus = row.assignment_status;
            if (oldStatus !== newStatus) {
              if (newStatus === "confirmed") {
                toast.success("Plantão confirmado", undefined, `assign-conf-${row.id}`);
              } else if (newStatus === "rejected") {
                toast.warning("Plantão recusado", undefined, `assign-rej-${row.id}`);
              }
            }
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // shift_swap_requests
    unsubs.push(
      subscribe(
        { table: "shift_swap_requests", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"shift_swap_requests">) => {
          void qc.invalidateQueries({ queryKey: opsKeys.swaps() });
          void qc.invalidateQueries({ queryKey: opsKeys.dashboard() });
          void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
          void qc.invalidateQueries({ queryKey: opsKeys.operationalAnalytics() });

          const row = (evt.newRow ?? evt.oldRow) as SwapRow | null;
          if (!row) return;
          if (isSuppressed("shift_swap_requests", row.id)) return;

          const involvesMe =
            professionalId &&
            (row.requester_professional_id === professionalId ||
              row.target_professional_id === professionalId);

          if (
            evt.eventType === "INSERT" &&
            professionalId &&
            row.target_professional_id === professionalId
          ) {
            toast.info(
              "Nova solicitação de troca",
              "Você foi indicado em uma troca de plantão.",
              `swap-new-${row.id}`,
            );
            return;
          }

          if (evt.eventType === "UPDATE" && involvesMe) {
            const oldStatus = (evt.oldRow as SwapRow | null)?.status;
            const newStatus = row.status;
            if (oldStatus !== newStatus) {
              if (newStatus === "approved") {
                toast.success("Troca aprovada", undefined, `swap-app-${row.id}`);
              } else if (newStatus === "denied") {
                toast.warning("Troca recusada", undefined, `swap-den-${row.id}`);
              } else if (newStatus === "cancelled") {
                toast.info("Troca cancelada", undefined, `swap-cnc-${row.id}`);
              }
            }
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // availability
    unsubs.push(
      subscribe({ table: "availability", filter: `tenant_id=eq.${tenantId}` }, () => {
        void qc.invalidateQueries({ queryKey: opsKeys.availability() });
        void qc.invalidateQueries({ queryKey: opsKeys.dashboard() });
        void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
        void qc.invalidateQueries({ queryKey: opsKeys.operationalAnalytics() });
        // Disponibilidade não dispara toast — é silencioso por design
        // (evita ruído quando o gestor edita várias janelas em sequência).
      }),
    );

    // ----------------------------------------------------------------
    // operational_events — timeline / audit (sem toast; só invalidação).
    unsubs.push(
      subscribe(
        { table: "operational_events", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_events">) => {
          if (evt.eventType !== "INSERT") return;
          void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          void qc.invalidateQueries({ queryKey: opsKeys.operationalAnalytics() });
        },
      ),
    );

    // ----------------------------------------------------------------
    // operational_mutation_executions — execução supervisionada
    unsubs.push(
      subscribe(
        { table: "operational_mutation_executions", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_mutation_executions">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({
              queryKey: [...opsKeys.all, "operational-mutation-executions"],
            });
            void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // operational_orchestrations — fluxos supervisionados multi-passo
    unsubs.push(
      subscribe(
        { table: "operational_orchestrations", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_orchestrations">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({ queryKey: opsKeys.orchestrations() });
            const row = (evt.newRow ?? evt.oldRow) as { id?: string } | null;
            if (row?.id) void qc.invalidateQueries({ queryKey: opsKeys.orchestration(row.id) });
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // operational_orchestration_steps — passos e dependências
    unsubs.push(
      subscribe({ table: "operational_orchestration_steps" }, () => {
        void qc.invalidateQueries({ queryKey: opsKeys.orchestrations() });
      }),
    );

    // ----------------------------------------------------------------
    // operational_recommendation_feedback — efeitos agregados na central
    unsubs.push(
      subscribe(
        { table: "operational_recommendation_feedback", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_recommendation_feedback">) => {
          if (evt.eventType !== "INSERT") return;
          void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
          void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
        },
      ),
    );

    unsubs.push(
      subscribe(
        { table: "operational_policy_intelligence_cycles", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_policy_intelligence_cycles">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
            void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          }
        },
      ),
    );

    unsubs.push(
      subscribe(
        {
          table: "operational_policy_governance_recommendations",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (evt: ChangeEvent<"operational_policy_governance_recommendations">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
            void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          }
        },
      ),
    );

    unsubs.push(
      subscribe(
        { table: "operational_strategic_planning_cycles", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_strategic_planning_cycles">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
            void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          }
        },
      ),
    );

    // operational_memory_entries — painel de memória / effectiveness na central
    unsubs.push(
      subscribe(
        { table: "operational_memory_entries", filter: `tenant_id=eq.${tenantId}` },
        (evt: ChangeEvent<"operational_memory_entries">) => {
          if (evt.eventType === "INSERT" || evt.eventType === "UPDATE") {
            void qc.invalidateQueries({ queryKey: opsKeys.commandCenter() });
            void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
          }
        },
      ),
    );

    // ----------------------------------------------------------------
    // Catch-up em reconexão / volta de foco: revalida o universo
    // operacional para alinhar UI com o que rodou enquanto offline.
    unsubs.push(
      onRealtimeReconnect(() => {
        void qc.invalidateQueries({ queryKey: opsKeys.all });
      }),
    );

    return () => {
      for (const u of unsubs) {
        try {
          u();
        } catch {
          // ignore
        }
      }
    };
  }, [qc, tenantId, professionalId]);
}

/**
 * Encerra todos os canais. Chamado explicitamente em logout para
 * garantir que a próxima sessão (potencialmente em outro tenant)
 * não receba eventos da anterior.
 */
export function teardownOperationalRealtime(): void {
  teardownAllRealtime();
}
