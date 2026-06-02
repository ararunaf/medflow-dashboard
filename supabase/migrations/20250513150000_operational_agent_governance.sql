-- MedFlow-IA: agentes operacionais supervisionados (domínio escopado, sem autonomia de execução).
-- Sessões persistem estado de governança; operational_events mantém audit trail append-only.

-- ---------------------------------------------------------------------------
-- Timeline: entidade e eventos de agente operacional
-- ---------------------------------------------------------------------------
ALTER TABLE public.operational_events DROP CONSTRAINT IF EXISTS operational_events_entity_type_chk;
ALTER TABLE public.operational_events ADD CONSTRAINT operational_events_entity_type_chk CHECK (
  entity_type IN (
    'shift',
    'assignment',
    'swap',
    'availability',
    'schedule',
    'alert',
    'coordinator_action',
    'orchestration',
    'operational_agent'
  )
);

ALTER TABLE public.operational_events DROP CONSTRAINT IF EXISTS operational_events_event_type_chk;
ALTER TABLE public.operational_events ADD CONSTRAINT operational_events_event_type_chk CHECK (
  event_type IN (
    'shift_created',
    'shift_updated',
    'shift_cancelled',
    'assignment_created',
    'assignment_confirmed',
    'assignment_rejected',
    'swap_requested',
    'swap_approved',
    'swap_denied',
    'availability_updated',
    'critical_alert_generated',
    'operational_action_triggered',
    'orchestration_created',
    'orchestration_submitted_for_approval',
    'orchestration_approved',
    'orchestration_step_advanced',
    'orchestration_blocked',
    'orchestration_completed',
    'orchestration_rollback_previewed',
    'orchestration_rollback_step',
    'orchestration_rolled_back',
    'operational_agent_reasoning_cycle',
    'operational_agent_human_approved',
    'operational_agent_human_blocked',
    'operational_agent_unblocked'
  )
);

-- ---------------------------------------------------------------------------
-- Sessão de governança por agente (um registro por tenant + tipo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_agent_governance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  agent_type text NOT NULL,
  state text NOT NULL DEFAULT 'idle',
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  surface_fingerprint text NOT NULL DEFAULT '',
  rationale_summary text NOT NULL DEFAULT '',
  reasoning_headlines_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  explainability_refs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_agent_governance_sessions_agent_type_chk CHECK (
    agent_type IN (
      'coverage_agent',
      'coordination_agent',
      'risk_agent',
      'recommendation_agent'
    )
  ),
  CONSTRAINT operational_agent_governance_sessions_state_chk CHECK (
    state IN (
      'idle',
      'reasoning',
      'awaiting_human_review',
      'approved',
      'blocked'
    )
  ),
  CONSTRAINT operational_agent_governance_sessions_tenant_agent_uk UNIQUE (tenant_id, agent_type)
);

CREATE INDEX IF NOT EXISTS operational_agent_governance_sessions_tenant_updated_idx
  ON public.operational_agent_governance_sessions (tenant_id, updated_at DESC);

ALTER TABLE public.operational_agent_governance_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_agent_governance_sessions_select_manager
  ON public.operational_agent_governance_sessions;
DROP POLICY IF EXISTS operational_agent_governance_sessions_insert_manager
  ON public.operational_agent_governance_sessions;
DROP POLICY IF EXISTS operational_agent_governance_sessions_update_manager
  ON public.operational_agent_governance_sessions;

CREATE POLICY operational_agent_governance_sessions_select_manager
  ON public.operational_agent_governance_sessions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_agent_governance_sessions_insert_manager
  ON public.operational_agent_governance_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND updated_by_profile_id = auth.uid()
  );

CREATE POLICY operational_agent_governance_sessions_update_manager
  ON public.operational_agent_governance_sessions
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND updated_by_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_agent_governance_sessions IS
  'Estado de governança por agente operacional supervisionado (sem execução autônoma).';
