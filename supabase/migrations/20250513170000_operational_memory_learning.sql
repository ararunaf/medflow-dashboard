-- MedFlow-IA: memória operacional supervisionada + rastreio de outcomes / effectiveness
-- (sem RL, sem autonomia de execução — apenas registro auditável e sinais para pipelines futuros).

-- ---------------------------------------------------------------------------
-- Timeline: entidade operational_memory + eventos de aprendizado auditável
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
    'operational_memory'
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
    'operational_learning_signal_captured'
  )
);

-- ---------------------------------------------------------------------------
-- Estados e tipos de memória (supervisionado)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_memory_state') THEN
    CREATE TYPE public.operational_memory_state AS ENUM (
      'observed',
      'tracked',
      'validated',
      'archived'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_memory_kind') THEN
    CREATE TYPE public.operational_memory_kind AS ENUM (
      'recommendation_outcome',
      'mitigation_effectiveness',
      'execution_outcome',
      'rollback_signal',
      'deterioration_pattern',
      'coordination_effectiveness',
      'orchestration_effectiveness',
      'proposal_outcome',
      'forecast_accuracy_snapshot'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  memory_kind public.operational_memory_kind NOT NULL,
  memory_state public.operational_memory_state NOT NULL DEFAULT 'observed',
  subject_kind text NOT NULL,
  subject_id text NOT NULL,
  correlation_id text,
  effectiveness_score numeric(5, 4),
  learning_signals_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  explainability_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  references_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome_narrative text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_memory_entries_subject_kind_chk CHECK (
    subject_kind IN (
      'recommendation',
      'proposal',
      'mutation_execution',
      'orchestration',
      'coordination_cycle',
      'forecast_window',
      'operational_bundle'
    )
  ),
  CONSTRAINT operational_memory_entries_effectiveness_chk CHECK (
    effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)
  )
);

CREATE INDEX IF NOT EXISTS operational_memory_entries_tenant_created_idx
  ON public.operational_memory_entries (tenant_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS operational_memory_entries_tenant_kind_idx
  ON public.operational_memory_entries (tenant_id, memory_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_memory_entries_tenant_state_idx
  ON public.operational_memory_entries (tenant_id, memory_state, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_memory_entries_tenant_subject_idx
  ON public.operational_memory_entries (tenant_id, subject_kind, subject_id, created_at DESC);

COMMENT ON TABLE public.operational_memory_entries IS
  'Memória operacional supervisionada: outcomes, effectiveness e sinais leves para aprendizado futuro (sem RL na aplicação).';

ALTER TABLE public.operational_memory_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_memory_entries_select_manager ON public.operational_memory_entries;
CREATE POLICY operational_memory_entries_select_manager
  ON public.operational_memory_entries
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

DROP POLICY IF EXISTS operational_memory_entries_insert_manager ON public.operational_memory_entries;
CREATE POLICY operational_memory_entries_insert_manager
  ON public.operational_memory_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS operational_memory_entries_update_manager ON public.operational_memory_entries;
CREATE POLICY operational_memory_entries_update_manager
  ON public.operational_memory_entries
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

-- Realtime (Supabase hosted)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_memory_entries;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
