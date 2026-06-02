/**
 * Registro canônico de tipos de entidade, evento e severidade da timeline operacional.
 * Mantido alinhado às migrations `20250512000003_operational_events_timeline.sql` e
 * `20250513130000_operational_orchestrations_layer.sql` e
 * `20250513150000_operational_agent_governance.sql` e
 * `20250513160000_operational_agent_coordination.sql` e
 * `20250513170000_operational_memory_learning.sql` (extensões de entity/event) e
 * `20250513201000_tiss_operational_foundation.sql` (TISS / faturamento) e
 * `20250513210000_tiss_returns_denials_appeals.sql` (retornos, glosas, recursos) e
 * `20250513220000_medical_payouts_foundation.sql` (produção / repasses).
 */
import type {
  OperationalEntityType,
  OperationalEventSeverity,
  OperationalEventType,
} from "@/lib/database.types";

export const OPERATIONAL_ENTITY_TYPES: readonly OperationalEntityType[] = [
  "shift",
  "assignment",
  "swap",
  "availability",
  "schedule",
  "alert",
  "coordinator_action",
  "orchestration",
  "operational_agent",
  "agent_coordination",
  "operational_memory",
  "policy_intelligence",
  "strategic_operational_planning",
  "tiss_guide",
  "tiss_batch",
  "tiss_batch_export",
  "tiss_return",
  "tiss_denial",
  "tiss_denial_appeal",
  "medical_production",
  "medical_payout",
  "payout_rule",
] as const;

export const OPERATIONAL_EVENT_TYPES: readonly OperationalEventType[] = [
  "shift_created",
  "shift_updated",
  "shift_cancelled",
  "assignment_created",
  "assignment_confirmed",
  "assignment_rejected",
  "swap_requested",
  "swap_approved",
  "swap_denied",
  "availability_updated",
  "critical_alert_generated",
  "operational_action_triggered",
  "orchestration_created",
  "orchestration_submitted_for_approval",
  "orchestration_approved",
  "orchestration_step_advanced",
  "orchestration_blocked",
  "orchestration_completed",
  "orchestration_rollback_previewed",
  "orchestration_rollback_step",
  "orchestration_rolled_back",
  "operational_agent_reasoning_cycle",
  "operational_agent_human_approved",
  "operational_agent_human_blocked",
  "operational_agent_unblocked",
  "operational_agent_coordination_cycle",
  "operational_memory_recorded",
  "operational_memory_state_updated",
  "operational_learning_signal_captured",
  "policy_intelligence_analysis_recorded",
  "policy_intelligence_cycle_state_updated",
  "policy_governance_recommendation_recorded",
  "policy_governance_recommendation_state_updated",
  "strategic_planning_cycle_recorded",
  "strategic_planning_cycle_state_updated",
  "strategic_planning_audit_appended",
  "tiss_guide_created",
  "tiss_guide_updated",
  "tiss_batch_closed",
  "tiss_batch_exported",
  "tiss_return_received",
  "tiss_return_processed",
  "tiss_denial_created",
  "tiss_denial_updated",
  "tiss_denial_reversed",
  "tiss_denial_appeal_created",
  "tiss_denial_appeal_updated",
  "medical_production_synced",
  "medical_payout_calculated",
  "medical_payout_reviewed",
  "medical_payout_approved",
  "medical_payout_paid",
  "medical_payout_status_changed",
  "payout_rule_created",
  "payout_rule_updated",
] as const;

export const OPERATIONAL_EVENT_SEVERITIES: readonly OperationalEventSeverity[] = [
  "info",
  "warning",
  "critical",
] as const;

const ENTITY = new Set<string>(OPERATIONAL_ENTITY_TYPES);
const EVENT = new Set<string>(OPERATIONAL_EVENT_TYPES);
const SEV = new Set<string>(OPERATIONAL_EVENT_SEVERITIES);

export function isOperationalEntityType(v: string): v is OperationalEntityType {
  return ENTITY.has(v);
}

export function isOperationalEventType(v: string): v is OperationalEventType {
  return EVENT.has(v);
}

export function isOperationalEventSeverity(v: string): v is OperationalEventSeverity {
  return SEV.has(v);
}
