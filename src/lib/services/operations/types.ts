/**
 * Tipos compartilhados pelos services operacionais.
 * Mantém o boilerplate de assinatura unificado em `ServiceCtx`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/database.types";

export type OperationalClient = SupabaseClient<Database>;

/**
 * Contexto mínimo que todo service de mutation recebe.
 *
 * `client` carrega a sessão JWT do usuário (RLS aplica),
 * `tenantId`/`role` permitem checagens de RBAC sem novo round-trip,
 * `professionalId` é exigido para fluxos *self-service*.
 */
export type ServiceCtx = {
  client: OperationalClient;
  tenantId: string;
  role: UserRole;
  userId: string;
  /** Sempre `profiles.id` (igual ao usuário autenticado) para audit trail. */
  actorProfileId: string;
  professionalId: string | null;
};

export type ScheduleRow = Database["public"]["Tables"]["schedules"]["Row"];
export type ShiftRow = Database["public"]["Tables"]["shifts"]["Row"];
export type ShiftAssignmentRow = Database["public"]["Tables"]["shift_assignments"]["Row"];
export type ShiftSwapRequestRow = Database["public"]["Tables"]["shift_swap_requests"]["Row"];
export type AvailabilityRow = Database["public"]["Tables"]["availability"]["Row"];
