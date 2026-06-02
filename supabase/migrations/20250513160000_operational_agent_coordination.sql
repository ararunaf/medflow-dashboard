-- MedFlow-IA: coordenação colaborativa supervisionada entre agentes operacionais (sem autonomia de execução).

-- ---------------------------------------------------------------------------
-- Timeline: coordenação multi-agente
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
    'operational_agent',
    'agent_coordination'
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
    'operational_agent_unblocked',
    'operational_agent_coordination_cycle'
  )
);

-- ---------------------------------------------------------------------------
-- Ciclos de coordenação (append-only lógico: inserts apenas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_agent_coordination_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  surface_fingerprint text NOT NULL DEFAULT '',
  semantic_fingerprint text NOT NULL DEFAULT '',
  shared_context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  participants_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  collaboration_narrative text NOT NULL DEFAULT '',
  conflicts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  provenance_refs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  orchestration_summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_agent_coordination_cycles_tenant_created_idx
  ON public.operational_agent_coordination_cycles (tenant_id, created_at DESC);

ALTER TABLE public.operational_agent_coordination_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_agent_coordination_cycles_select_manager
  ON public.operational_agent_coordination_cycles;
DROP POLICY IF EXISTS operational_agent_coordination_cycles_insert_manager
  ON public.operational_agent_coordination_cycles;

CREATE POLICY operational_agent_coordination_cycles_select_manager
  ON public.operational_agent_coordination_cycles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_agent_coordination_cycles_insert_manager
  ON public.operational_agent_coordination_cycles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND created_by_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_agent_coordination_cycles IS
  'Ciclos de coordenação colaborativa entre agentes operacionais (supervisionados, explainable, auditáveis).';
