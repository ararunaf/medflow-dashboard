-- MedFlow-IA: inteligência operacional de políticas supervisionadas (análise + recomendações
-- explicáveis + auditoria). Sem auto-execução, sem RL, sem governança auto-modificante.

-- ---------------------------------------------------------------------------
-- Timeline: entidade policy_intelligence + eventos auditáveis
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
    'policy_intelligence'
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
    'policy_governance_recommendation_state_updated'
  )
);

-- ---------------------------------------------------------------------------
-- Estados supervisionados do ciclo de policy intelligence
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'supervised_policy_lifecycle_state') THEN
    CREATE TYPE public.supervised_policy_lifecycle_state AS ENUM (
      'observed',
      'analyzed',
      'recommended',
      'supervised_review',
      'validated'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_policy_governance_recommendation_kind') THEN
    CREATE TYPE public.operational_policy_governance_recommendation_kind AS ENUM (
      'threshold_tuning',
      'orchestration_policy',
      'escalation_tuning',
      'adaptive_boundary',
      'coordination_governance'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_policy_intelligence_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  fingerprint text NOT NULL,
  signal_digest_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  findings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  governance_narrative text NOT NULL DEFAULT '',
  lifecycle_state public.supervised_policy_lifecycle_state NOT NULL DEFAULT 'recommended',
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_policy_intel_cycles_tenant_computed_idx
  ON public.operational_policy_intelligence_cycles (tenant_id, computed_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS operational_policy_intel_cycles_tenant_fingerprint_idx
  ON public.operational_policy_intelligence_cycles (tenant_id, fingerprint, computed_at DESC);

COMMENT ON TABLE public.operational_policy_intelligence_cycles IS
  'Ciclos de análise de políticas operacionais supervisionados — digest compacto, achados e narrativa de governança.';

CREATE TABLE IF NOT EXISTS public.operational_policy_governance_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.operational_policy_intelligence_cycles (id) ON DELETE CASCADE,
  recommendation_kind public.operational_policy_governance_recommendation_kind NOT NULL,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  explainability_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggestion_fingerprint text NOT NULL DEFAULT '',
  lifecycle_state public.supervised_policy_lifecycle_state NOT NULL DEFAULT 'recommended',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_policy_gov_rec_title_len CHECK (char_length(title) <= 512),
  CONSTRAINT operational_policy_gov_rec_detail_len CHECK (char_length(detail) <= 8000)
);

CREATE INDEX IF NOT EXISTS operational_policy_gov_rec_tenant_cycle_idx
  ON public.operational_policy_governance_recommendations (tenant_id, cycle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_policy_gov_rec_tenant_state_idx
  ON public.operational_policy_governance_recommendations (tenant_id, lifecycle_state, created_at DESC);

COMMENT ON TABLE public.operational_policy_governance_recommendations IS
  'Recomendações de governança explicáveis — exigem revisão humana; não executam políticas.';

CREATE TABLE IF NOT EXISTS public.operational_policy_intelligence_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  cycle_id uuid REFERENCES public.operational_policy_intelligence_cycles (id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.operational_policy_governance_recommendations (id) ON DELETE SET NULL,
  action text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_policy_intel_audit_action_len CHECK (char_length(action) <= 128)
);

CREATE INDEX IF NOT EXISTS operational_policy_intel_audit_tenant_created_idx
  ON public.operational_policy_intelligence_audit (tenant_id, created_at DESC, id DESC);

COMMENT ON TABLE public.operational_policy_intelligence_audit IS
  'Trilha append-only de análises e transições de governança de políticas (timestamp + ator + refs).';

-- ---------------------------------------------------------------------------
-- RLS (gestores operacionais)
-- ---------------------------------------------------------------------------
ALTER TABLE public.operational_policy_intelligence_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_policy_governance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_policy_intelligence_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_policy_intel_cycles_select_manager
  ON public.operational_policy_intelligence_cycles;
CREATE POLICY operational_policy_intel_cycles_select_manager
  ON public.operational_policy_intelligence_cycles
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_policy_intel_cycles_insert_manager
  ON public.operational_policy_intelligence_cycles;
CREATE POLICY operational_policy_intel_cycles_insert_manager
  ON public.operational_policy_intelligence_cycles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS operational_policy_intel_cycles_update_manager
  ON public.operational_policy_intelligence_cycles;
CREATE POLICY operational_policy_intel_cycles_update_manager
  ON public.operational_policy_intelligence_cycles
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

DROP POLICY IF EXISTS operational_policy_gov_rec_select_manager
  ON public.operational_policy_governance_recommendations;
CREATE POLICY operational_policy_gov_rec_select_manager
  ON public.operational_policy_governance_recommendations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_policy_gov_rec_insert_manager
  ON public.operational_policy_governance_recommendations;
CREATE POLICY operational_policy_gov_rec_insert_manager
  ON public.operational_policy_governance_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_policy_gov_rec_update_manager
  ON public.operational_policy_governance_recommendations;
CREATE POLICY operational_policy_gov_rec_update_manager
  ON public.operational_policy_governance_recommendations
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

DROP POLICY IF EXISTS operational_policy_intel_audit_select_manager
  ON public.operational_policy_intelligence_audit;
CREATE POLICY operational_policy_intel_audit_select_manager
  ON public.operational_policy_intelligence_audit
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_policy_intel_audit_insert_manager
  ON public.operational_policy_intelligence_audit;
CREATE POLICY operational_policy_intel_audit_insert_manager
  ON public.operational_policy_intelligence_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Realtime (opcional — invalidação leve na central)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_policy_intelligence_cycles;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_policy_governance_recommendations;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
