-- MedFlow-IA: propostas de ação operacional supervisionadas (sem execução automática).
-- Estados: rascunho → sugerida → aguardando confirmação → aprovada/rejeitada/expirada (TTL).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_action_proposal_state') THEN
    CREATE TYPE public.operational_action_proposal_state AS ENUM (
      'draft',
      'suggested',
      'awaiting_confirmation',
      'approved',
      'rejected',
      'expired'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_action_kind') THEN
    CREATE TYPE public.operational_action_kind AS ENUM (
      'staffing_adjustment',
      'escalation',
      'mitigation',
      'coordination',
      'operational_review',
      'assignment_suggestion'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_action_proposal_audit_event') THEN
    CREATE TYPE public.operational_action_proposal_audit_event AS ENUM (
      'created',
      'submitted_for_confirmation',
      'approved',
      'rejected',
      'expired',
      'updated_metadata'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_action_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  created_by_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  state public.operational_action_proposal_state NOT NULL DEFAULT 'draft',
  action_kind public.operational_action_kind NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  operational_rationale text NOT NULL DEFAULT '',
  references_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'manual',
  gpt_correlation_id text,
  context_fingerprint text,
  dedupe_key text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  approved_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  rejected_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  approval_note text,
  rejection_justification text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_action_proposals_title_len CHECK (char_length(title) <= 240),
  CONSTRAINT operational_action_proposals_summary_len CHECK (char_length(summary) <= 2000),
  CONSTRAINT operational_action_proposals_rationale_len CHECK (char_length(operational_rationale) <= 6000),
  CONSTRAINT operational_action_proposals_refs_size CHECK (pg_column_size(references_json) <= 24000),
  CONSTRAINT operational_action_proposals_payload_size CHECK (pg_column_size(payload_json) <= 32000)
);

CREATE INDEX IF NOT EXISTS operational_action_proposals_tenant_state_created_idx
  ON public.operational_action_proposals (tenant_id, state, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_action_proposals_tenant_dedupe_idx
  ON public.operational_action_proposals (tenant_id, dedupe_key, created_at DESC)
  WHERE dedupe_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.operational_action_proposal_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.operational_action_proposals (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  event public.operational_action_proposal_audit_event NOT NULL,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_action_proposal_audit_proposal_created_idx
  ON public.operational_action_proposal_audit (proposal_id, created_at ASC);

ALTER TABLE public.operational_action_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_action_proposal_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_action_proposals_select_manager ON public.operational_action_proposals;
DROP POLICY IF EXISTS operational_action_proposals_insert_manager ON public.operational_action_proposals;
DROP POLICY IF EXISTS operational_action_proposals_update_manager ON public.operational_action_proposals;
DROP POLICY IF EXISTS operational_action_proposal_audit_select_manager ON public.operational_action_proposal_audit;
DROP POLICY IF EXISTS operational_action_proposal_audit_insert_manager ON public.operational_action_proposal_audit;

CREATE POLICY operational_action_proposals_select_manager
  ON public.operational_action_proposals
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_action_proposals_insert_manager
  ON public.operational_action_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND created_by_profile_id = auth.uid()
  );

CREATE POLICY operational_action_proposals_update_manager
  ON public.operational_action_proposals
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

CREATE POLICY operational_action_proposal_audit_select_manager
  ON public.operational_action_proposal_audit
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY operational_action_proposal_audit_insert_manager
  ON public.operational_action_proposal_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_action_proposals IS 'Propostas de ação operacional (IA supervisionada); não executa mutações — apenas governança e auditoria.';
COMMENT ON TABLE public.operational_action_proposal_audit IS 'Trilha append-only de eventos de proposta (aprovação, rejeição, etc.).';
