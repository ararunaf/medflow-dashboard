-- MedFlow-IA: execução supervisionada de mutações operacionais (pós-sandbox seguro).
-- Transacional no sentido de compensação na aplicação + lock por proposta + idempotência.
-- Não cobre execução autônoma — exige proposta aprovada, sandbox safe e confirmação explícita.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_mutation_execution_state') THEN
    CREATE TYPE public.operational_mutation_execution_state AS ENUM (
      'queued',
      'executing',
      'executed',
      'rolled_back',
      'failed',
      'blocked'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_mutation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.operational_action_proposals (id) ON DELETE CASCADE,
  sandbox_run_id uuid NOT NULL REFERENCES public.operational_execution_sandbox_runs (id) ON DELETE RESTRICT,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  state public.operational_mutation_execution_state NOT NULL DEFAULT 'queued',
  approval_confirmed boolean NOT NULL DEFAULT false,
  idempotency_key text,
  block_reason text,
  policy_checks_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  explainability_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_steps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollback_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  affected_entities_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_mutation_executions_idempotency_len_chk
    CHECK (idempotency_key IS NULL OR char_length(idempotency_key) <= 200),
  CONSTRAINT operational_mutation_executions_block_reason_len_chk
    CHECK (block_reason IS NULL OR char_length(block_reason) <= 4000),
  CONSTRAINT operational_mutation_executions_policy_checks_size_chk
    CHECK (pg_column_size(policy_checks_snapshot) <= 48000),
  CONSTRAINT operational_mutation_executions_explainability_size_chk
    CHECK (pg_column_size(explainability_json) <= 32000),
  CONSTRAINT operational_mutation_executions_applied_steps_size_chk
    CHECK (pg_column_size(applied_steps_json) <= 64000),
  CONSTRAINT operational_mutation_executions_result_size_chk
    CHECK (pg_column_size(result_payload) <= 64000),
  CONSTRAINT operational_mutation_executions_rollback_size_chk
    CHECK (pg_column_size(rollback_payload) <= 64000),
  CONSTRAINT operational_mutation_executions_affected_entities_size_chk
    CHECK (pg_column_size(affected_entities_json) <= 48000)
);

CREATE INDEX IF NOT EXISTS operational_mutation_executions_tenant_proposal_created_idx
  ON public.operational_mutation_executions (tenant_id, proposal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_mutation_executions_tenant_state_created_idx
  ON public.operational_mutation_executions (tenant_id, state, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS operational_mutation_executions_idempotency_uidx
  ON public.operational_mutation_executions (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE UNIQUE INDEX IF NOT EXISTS operational_mutation_executions_active_proposal_uidx
  ON public.operational_mutation_executions (tenant_id, proposal_id)
  WHERE state IN ('queued', 'executing');

ALTER TABLE public.operational_mutation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_mutation_executions_select_manager ON public.operational_mutation_executions;
DROP POLICY IF EXISTS operational_mutation_executions_insert_manager ON public.operational_mutation_executions;
DROP POLICY IF EXISTS operational_mutation_executions_update_manager ON public.operational_mutation_executions;

CREATE POLICY operational_mutation_executions_select_manager
  ON public.operational_mutation_executions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_mutation_executions_insert_manager
  ON public.operational_mutation_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

CREATE POLICY operational_mutation_executions_update_manager
  ON public.operational_mutation_executions
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

COMMENT ON TABLE public.operational_mutation_executions IS
  'Execução supervisionada de mutações reais após sandbox safe + proposta aprovada; idempotência, lock por proposta e trilha de rollback.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_mutation_executions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
