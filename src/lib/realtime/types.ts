/**
 * Tipos compartilhados pela camada realtime operacional.
 *
 * - `RealtimeOpsTable` enumera somente as tabelas relevantes ao loop
 *   operacional (sem `tenants`, `profiles`, etc.) para evitar canais
 *   inúteis e prevenir typos.
 * - `ChangeEvent` é uma versão normalizada do payload do
 *   `postgres_changes` do Supabase, já tipada por tabela.
 */
import type { Database } from "@/lib/database.types";

export type RealtimeOpsTable =
  | "shifts"
  | "shift_assignments"
  | "shift_swap_requests"
  | "availability"
  | "operational_events"
  | "operational_recommendation_feedback"
  | "operational_mutation_executions"
  | "operational_orchestrations"
  | "operational_orchestration_steps"
  | "operational_memory_entries"
  | "operational_policy_intelligence_cycles"
  | "operational_policy_governance_recommendations"
  | "operational_strategic_planning_cycles";

export type RowFor<T extends RealtimeOpsTable> = Database["public"]["Tables"][T]["Row"];

export type ChangeEventType = "INSERT" | "UPDATE" | "DELETE";

export type ChangeEvent<T extends RealtimeOpsTable = RealtimeOpsTable> = {
  table: T;
  eventType: ChangeEventType;
  /** Linha após a mudança (INSERT/UPDATE). `null` em DELETE. */
  newRow: RowFor<T> | null;
  /** Linha antes da mudança (UPDATE/DELETE). `null` em INSERT. */
  oldRow: RowFor<T> | null;
  /** Timestamp do commit no banco (string ISO). */
  commitTimestamp: string;
};

export type RealtimeStatus = "idle" | "connecting" | "open" | "error" | "closed";

export type SubscribeOptions<T extends RealtimeOpsTable> = {
  table: T;
  /**
   * Filtro Postgres no formato `coluna=eq.valor`. Quando informado, o
   * Supabase Realtime entrega só eventos compatíveis com o filtro,
   * reduzindo tráfego e re-renderizações desnecessárias.
   */
  filter?: string;
  /** Filtra por tipo de evento. Default: `*`. */
  event?: ChangeEventType | "*";
};

export type Unsubscribe = () => void;
