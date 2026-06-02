-- MedFlow-IA: planejamento operacional estratégico supervisionado (readiness, stress digest,
-- roadmaps explicáveis). Sem planejamento autônomo, sem auto-execução de planos.

-- ---------------------------------------------------------------------------
-- Timeline: entidade strategic_operational_planning + eventos auditáveis
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
    'agent_coordination',
    'operational_memory',
    'policy_intelligence',
    'strategic_operational_planning'
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
    'operational_agent_coordination_cycle',
    'operational_memory_recorded',
    'operational_memory_state_updated',
    'operational_learning_signal_captured',
    'policy_intelligence_analysis_recorded',
    'policy_intelligence_cycle_state_updated',
    'policy_governance_recommendation_recorded',
    'policy_governance_recommendation_state_updated',
    'strategic_planning_cycle_recorded',
    'strategic_planning_cycle_state_updated',
    'strategic_planning_audit_appended'
  )
);

-- ---------------------------------------------------------------------------
-- Ciclo de planejamento estratégico supervisionado
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_strategic_planning_lifecycle_state') THEN
    CREATE TYPE public.operational_strategic_planning_lifecycle_state AS ENUM (
      'projected',
      'analyzed',
      'planned',
      'supervised_review',
      'validated'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_strategic_planning_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  fingerprint text NOT NULL,
  stress_digest_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  planning_bundle_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  strategic_narrative text NOT NULL DEFAULT '',
  lifecycle_state public.operational_strategic_planning_lifecycle_state NOT NULL DEFAULT 'planned',
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_strategic_planning_narrative_len CHECK (char_length(strategic_narrative) <= 6000),
  CONSTRAINT operational_strategic_planning_fingerprint_len CHECK (char_length(fingerprint) <= 256)
);

CREATE INDEX IF NOT EXISTS operational_strategic_planning_cycles_tenant_computed_idx
  ON public.operational_strategic_planning_cycles (tenant_id, computed_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS operational_strategic_planning_cycles_tenant_fingerprint_idx
  ON public.operational_strategic_planning_cycles (tenant_id, fingerprint, computed_at DESC);

COMMENT ON TABLE public.operational_strategic_planning_cycles IS
  'Ciclos de planejamento operacional estratégico supervisionado — digest compacto, bundle explicável, sem auto-execução.';

CREATE TABLE IF NOT EXISTS public.operational_strategic_planning_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES public.operational_strategic_planning_cycles (id) ON DELETE SET NULL,
  action text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_strategic_planning_audit_action_len CHECK (char_length(action) <= 128)
);

CREATE INDEX IF NOT EXISTS operational_strategic_planning_audit_tenant_created_idx
  ON public.operational_strategic_planning_audit (tenant_id, created_at DESC, id DESC);

COMMENT ON TABLE public.operational_strategic_planning_audit IS
  'Trilha append-only de ciclos de planejamento estratégico (timestamp, ator, referências compactas).';

-- ---------------------------------------------------------------------------
-- RLS (gestores operacionais)
-- ---------------------------------------------------------------------------
ALTER TABLE public.operational_strategic_planning_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_strategic_planning_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_strategic_planning_cycles_select_manager
  ON public.operational_strategic_planning_cycles;
CREATE POLICY operational_strategic_planning_cycles_select_manager
  ON public.operational_strategic_planning_cycles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_strategic_planning_cycles_insert_manager
  ON public.operational_strategic_planning_cycles;
CREATE POLICY operational_strategic_planning_cycles_insert_manager
  ON public.operational_strategic_planning_cycles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS operational_strategic_planning_cycles_update_manager
  ON public.operational_strategic_planning_cycles;
CREATE POLICY operational_strategic_planning_cycles_update_manager
  ON public.operational_strategic_planning_cycles
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_strategic_planning_audit_select_manager
  ON public.operational_strategic_planning_audit;
CREATE POLICY operational_strategic_planning_audit_select_manager
  ON public.operational_strategic_planning_audit
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_strategic_planning_audit_insert_manager
  ON public.operational_strategic_planning_audit;
CREATE POLICY operational_strategic_planning_audit_insert_manager
  ON public.operational_strategic_planning_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Realtime (invalidação leve na central)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_strategic_planning_cycles;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
