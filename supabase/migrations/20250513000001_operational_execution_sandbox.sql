-- MedFlow-IA: camada de execução SANDBOX (dry-run / simulação / impacto / rollback preview).
-- Não executa mutações reais — apenas registra requisições e resultados de simulação
-- para auditoria e preparação da futura camada de mutation execution.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_simulation_state') THEN
    CREATE TYPE public.operational_simulation_state AS ENUM (
      'simulated',
      'safe',
      'risky',
      'blocked'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_execution_sandbox_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.operational_action_proposals (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  state public.operational_simulation_state NOT NULL,
  block_reason text,
  overall_severity text NOT NULL DEFAULT 'none',
  affected_entity_count int NOT NULL DEFAULT 0,
  mutations_count int NOT NULL DEFAULT 0,
  context_fingerprint text,
  schema_version text NOT NULL DEFAULT '1.0.0',
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_execution_sandbox_runs_result_size CHECK (pg_column_size(result_snapshot) <= 96000),
  CONSTRAINT operational_execution_sandbox_runs_metadata_size CHECK (pg_column_size(metadata) <= 8000),
  CONSTRAINT operational_execution_sandbox_runs_severity_chk CHECK (overall_severity IN ('none','low','moderate','high','critical'))
);

CREATE INDEX IF NOT EXISTS operational_execution_sandbox_runs_tenant_proposal_created_idx
  ON public.operational_execution_sandbox_runs (tenant_id, proposal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_execution_sandbox_runs_tenant_state_created_idx
  ON public.operational_execution_sandbox_runs (tenant_id, state, created_at DESC);

ALTER TABLE public.operational_execution_sandbox_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_execution_sandbox_runs_select_manager ON public.operational_execution_sandbox_runs;
DROP POLICY IF EXISTS operational_execution_sandbox_runs_insert_manager ON public.operational_execution_sandbox_runs;

CREATE POLICY operational_execution_sandbox_runs_select_manager
  ON public.operational_execution_sandbox_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_execution_sandbox_runs_insert_manager
  ON public.operational_execution_sandbox_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_execution_sandbox_runs IS
  'Execuções simuladas (dry-run) de propostas operacionais. Nada é executado de fato — registro existe apenas para auditoria e preparação da futura camada de mutation execution.';
