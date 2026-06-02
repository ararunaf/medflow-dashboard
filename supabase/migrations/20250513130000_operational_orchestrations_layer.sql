-- MedFlow-IA: camada de orquestração operacional supervisionada (policy-driven, multi-step).
-- Não habilita autonomia: cada avanço exige ator humano explícito via API/serviço.

-- ---------------------------------------------------------------------------
-- Timeline: entidade e eventos de orquestração (audit trail)
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
    'orchestration'
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
    'orchestration_rolled_back'
  )
);

-- ---------------------------------------------------------------------------
-- Orquestrações e passos (DAG linear/expandido persistido)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_orchestration_state') THEN
    CREATE TYPE public.operational_orchestration_state AS ENUM (
      'planned',
      'awaiting_approval',
      'orchestrating',
      'partially_executed',
      'completed',
      'rolled_back',
      'blocked'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_orchestration_step_kind') THEN
    CREATE TYPE public.operational_orchestration_step_kind AS ENUM (
      'proposal_gate',
      'sandbox_simulation',
      'supervised_execution'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_orchestration_step_state') THEN
    CREATE TYPE public.operational_orchestration_step_state AS ENUM (
      'pending',
      'ready',
      'running',
      'completed',
      'failed',
      'skipped',
      'rolled_back'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_orchestrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  created_by_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  state public.operational_orchestration_state NOT NULL DEFAULT 'planned',
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  narrative_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  policy_bundle_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollback_preview_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  execution_order_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  approval_note text,
  approved_at timestamptz,
  blocked_reason text,
  schema_version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_orchestrations_title_len CHECK (char_length(title) <= 240),
  CONSTRAINT operational_orchestrations_summary_len CHECK (char_length(summary) <= 4000),
  CONSTRAINT operational_orchestrations_narrative_size CHECK (pg_column_size(narrative_json) <= 96000),
  CONSTRAINT operational_orchestrations_policy_bundle_size CHECK (pg_column_size(policy_bundle_json) <= 32000),
  CONSTRAINT operational_orchestrations_rollback_preview_size CHECK (pg_column_size(rollback_preview_json) <= 48000),
  CONSTRAINT operational_orchestrations_execution_order_size CHECK (pg_column_size(execution_order_json) <= 8000)
);

CREATE INDEX IF NOT EXISTS operational_orchestrations_tenant_state_created_idx
  ON public.operational_orchestrations (tenant_id, state, created_at DESC);

CREATE TABLE IF NOT EXISTS public.operational_orchestration_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id uuid NOT NULL REFERENCES public.operational_orchestrations (id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  step_kind public.operational_orchestration_step_kind NOT NULL,
  depends_on_ordinals jsonb NOT NULL DEFAULT '[]'::jsonb,
  proposal_id uuid REFERENCES public.operational_action_proposals (id) ON DELETE RESTRICT,
  step_state public.operational_orchestration_step_state NOT NULL DEFAULT 'pending',
  sandbox_run_id uuid REFERENCES public.operational_execution_sandbox_runs (id) ON DELETE SET NULL,
  mutation_execution_id uuid REFERENCES public.operational_mutation_executions (id) ON DELETE SET NULL,
  rationale text NOT NULL DEFAULT '',
  explainability_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  policy_refs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_orchestration_steps_ordinal_uidx UNIQUE (orchestration_id, ordinal),
  CONSTRAINT operational_orchestration_steps_rationale_len CHECK (char_length(rationale) <= 8000),
  CONSTRAINT operational_orchestration_steps_explainability_size CHECK (pg_column_size(explainability_json) <= 32000),
  CONSTRAINT operational_orchestration_steps_policy_refs_size CHECK (pg_column_size(policy_refs_json) <= 16000),
  CONSTRAINT operational_orchestration_steps_last_error_len CHECK (last_error IS NULL OR char_length(last_error) <= 4000),
  CONSTRAINT operational_orchestration_steps_depends_chk CHECK (jsonb_typeof(depends_on_ordinals) = 'array')
);

CREATE INDEX IF NOT EXISTS operational_orchestration_steps_orch_ordinal_idx
  ON public.operational_orchestration_steps (orchestration_id, ordinal);

CREATE INDEX IF NOT EXISTS operational_orchestration_steps_proposal_idx
  ON public.operational_orchestration_steps (proposal_id);

ALTER TABLE public.operational_orchestrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_orchestration_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_orchestrations_select_manager ON public.operational_orchestrations;
DROP POLICY IF EXISTS operational_orchestrations_insert_manager ON public.operational_orchestrations;
DROP POLICY IF EXISTS operational_orchestrations_update_manager ON public.operational_orchestrations;

CREATE POLICY operational_orchestrations_select_manager
  ON public.operational_orchestrations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_orchestrations_insert_manager
  ON public.operational_orchestrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND created_by_profile_id = auth.uid()
  );

CREATE POLICY operational_orchestrations_update_manager
  ON public.operational_orchestrations
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

DROP POLICY IF EXISTS operational_orchestration_steps_select_manager ON public.operational_orchestration_steps;
DROP POLICY IF EXISTS operational_orchestration_steps_insert_manager ON public.operational_orchestration_steps;
DROP POLICY IF EXISTS operational_orchestration_steps_update_manager ON public.operational_orchestration_steps;

CREATE POLICY operational_orchestration_steps_select_manager
  ON public.operational_orchestration_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.operational_orchestrations o
      WHERE o.id = operational_orchestration_steps.orchestration_id
        AND o.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND public.is_operational_manager()
  );

CREATE POLICY operational_orchestration_steps_insert_manager
  ON public.operational_orchestration_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.operational_orchestrations o
      WHERE o.id = operational_orchestration_steps.orchestration_id
        AND o.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND public.is_operational_manager()
  );

CREATE POLICY operational_orchestration_steps_update_manager
  ON public.operational_orchestration_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.operational_orchestrations o
      WHERE o.id = operational_orchestration_steps.orchestration_id
        AND o.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND public.is_operational_manager()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.operational_orchestrations o
      WHERE o.id = operational_orchestration_steps.orchestration_id
        AND o.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND public.is_operational_manager()
  );

COMMENT ON TABLE public.operational_orchestrations IS
  'Orquestração supervisionada de workflows operacionais (cadeias de proposta/simulação/execução/rollback), governada por políticas explícitas.';

COMMENT ON TABLE public.operational_orchestration_steps IS
  'Passos ordenados com dependências (DAG); avanço apenas via ações humanas explícitas.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_orchestrations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_orchestration_steps;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
