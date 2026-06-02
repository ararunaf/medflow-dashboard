-- MedFlow-IA: conciliação operacional (esperado vs recebido), matching, divergências, importação CSV/manual.
-- Multi-tenant, RLS via can_manage_billing. Sem banco/ERP/OFX/CNAB.

-- ---------------------------------------------------------------------------
-- Timeline: conciliação operacional
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
    'strategic_operational_planning',
    'tiss_guide',
    'tiss_batch',
    'tiss_batch_export',
    'tiss_return',
    'tiss_denial',
    'tiss_denial_appeal',
    'medical_production',
    'medical_payout',
    'payout_rule',
    'financial_closing',
    'operational_reconciliation'
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
    'strategic_planning_audit_appended',
    'tiss_guide_created',
    'tiss_guide_updated',
    'tiss_batch_closed',
    'tiss_batch_exported',
    'tiss_return_received',
    'tiss_return_processed',
    'tiss_denial_created',
    'tiss_denial_updated',
    'tiss_denial_reversed',
    'tiss_denial_appeal_created',
    'tiss_denial_appeal_updated',
    'medical_production_synced',
    'medical_payout_calculated',
    'medical_payout_reviewed',
    'medical_payout_approved',
    'medical_payout_paid',
    'medical_payout_status_changed',
    'payout_rule_created',
    'payout_rule_updated',
    'financial_closing_created',
    'financial_closing_consolidated',
    'financial_closing_status_changed',
    'financial_closing_locked',
    'financial_closing_unlocked',
    'financial_closing_snapshot_created',
    'financial_closing_finalized',
    'financial_closing_reopened',
    'operational_reconciliation_created',
    'operational_reconciliation_status_changed',
    'operational_reconciliation_matching_run',
    'operational_reconciliation_divergence_detected'
  )
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_reconciliation_status') THEN
    CREATE TYPE public.operational_reconciliation_status AS ENUM (
      'draft',
      'processing',
      'reconciled',
      'divergent',
      'finalized'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_reconciliation_item_status') THEN
    CREATE TYPE public.operational_reconciliation_item_status AS ENUM (
      'matched',
      'partially_matched',
      'divergent',
      'pending'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_reconciliation_item_reference_type') THEN
    CREATE TYPE public.operational_reconciliation_item_reference_type AS ENUM (
      'competence_aggregate',
      'tiss_batch',
      'tiss_guide',
      'insurance_provider',
      'medical_payout',
      'manual_entry',
      'csv_import_row'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_reconciliation_issue_severity') THEN
    CREATE TYPE public.operational_reconciliation_issue_severity AS ENUM (
      'info',
      'warning',
      'critical'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_reconciliation_audit_action') THEN
    CREATE TYPE public.operational_reconciliation_audit_action AS ENUM (
      'reconciliation_created',
      'reconciliation_status_changed',
      'matching_run',
      'divergence_detected',
      'issue_resolved',
      'manual_adjustment',
      'import_applied',
      'item_updated'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Cabeçalho de conciliação por competência
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  competence_month date NOT NULL,
  expected_value numeric(14, 2) NOT NULL DEFAULT 0,
  received_value numeric(14, 2) NOT NULL DEFAULT 0,
  difference_value numeric(14, 2) NOT NULL DEFAULT 0,
  status public.operational_reconciliation_status NOT NULL DEFAULT 'draft',
  financial_closing_id uuid REFERENCES public.financial_closings (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_reconciliations_tenant_competence_uid UNIQUE (tenant_id, competence_month)
);

CREATE UNIQUE INDEX IF NOT EXISTS operational_reconciliations_tenant_id_id_uidx
  ON public.operational_reconciliations (tenant_id, id);

CREATE INDEX IF NOT EXISTS operational_reconciliations_tenant_status_idx
  ON public.operational_reconciliations (tenant_id, status, competence_month DESC);

-- ---------------------------------------------------------------------------
-- Itens (matching por dimensão + importações manuais/CSV)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_reconciliation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  reconciliation_id uuid NOT NULL REFERENCES public.operational_reconciliations (id) ON DELETE CASCADE,
  reference_type public.operational_reconciliation_item_reference_type NOT NULL,
  reference_id uuid,
  expected_value numeric(14, 2) NOT NULL DEFAULT 0,
  received_value numeric(14, 2) NOT NULL DEFAULT 0,
  difference_value numeric(14, 2) NOT NULL DEFAULT 0,
  status public.operational_reconciliation_item_status NOT NULL DEFAULT 'pending',
  CONSTRAINT operational_reconciliation_items_reconciliation_fk
    FOREIGN KEY (reconciliation_id)
    REFERENCES public.operational_reconciliations (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS operational_reconciliation_items_tenant_recon_idx
  ON public.operational_reconciliation_items (tenant_id, reconciliation_id);

CREATE UNIQUE INDEX IF NOT EXISTS operational_reconciliation_items_agg_uidx
  ON public.operational_reconciliation_items (reconciliation_id)
  WHERE reference_type = 'competence_aggregate';

CREATE UNIQUE INDEX IF NOT EXISTS operational_reconciliation_items_natural_uidx
  ON public.operational_reconciliation_items (reconciliation_id, reference_type, reference_id)
  WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Pendências / divergências operacionais
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_reconciliation_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  reconciliation_id uuid NOT NULL REFERENCES public.operational_reconciliations (id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  severity public.operational_reconciliation_issue_severity NOT NULL DEFAULT 'warning',
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_reconciliation_issues_type_chk CHECK (
    issue_type IN (
      'financial_difference',
      'glosa_not_reflected',
      'payout_inconsistent',
      'closing_divergent',
      'partial_receipt',
      'operational_pending'
    )
  ),
  CONSTRAINT operational_reconciliation_issues_desc_len CHECK (char_length(description) <= 4000),
  CONSTRAINT operational_reconciliation_issues_reconciliation_fk
    FOREIGN KEY (reconciliation_id)
    REFERENCES public.operational_reconciliations (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS operational_reconciliation_issues_recon_idx
  ON public.operational_reconciliation_issues (reconciliation_id, resolved, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS operational_reconciliation_issues_dedupe_uidx
  ON public.operational_reconciliation_issues (reconciliation_id, issue_type)
  WHERE resolved = false;

-- ---------------------------------------------------------------------------
-- Auditoria dedicada (conciliação, matching, divergência, resolução, alteração)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operational_reconciliation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  reconciliation_id uuid NOT NULL REFERENCES public.operational_reconciliations (id) ON DELETE CASCADE,
  action public.operational_reconciliation_audit_action NOT NULL,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_reconciliation_audit_payload_size_chk
    CHECK (octet_length(payload::text) <= 48000),
  CONSTRAINT operational_reconciliation_audit_reconciliation_fk
    FOREIGN KEY (reconciliation_id)
    REFERENCES public.operational_reconciliations (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS operational_reconciliation_audit_recon_idx
  ON public.operational_reconciliation_audit (reconciliation_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.operational_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_reconciliation_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_reconciliation_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_reconciliations_select_billing ON public.operational_reconciliations;
DROP POLICY IF EXISTS operational_reconciliations_insert_billing ON public.operational_reconciliations;
DROP POLICY IF EXISTS operational_reconciliations_update_billing ON public.operational_reconciliations;
DROP POLICY IF EXISTS operational_reconciliation_items_select_billing ON public.operational_reconciliation_items;
DROP POLICY IF EXISTS operational_reconciliation_items_insert_billing ON public.operational_reconciliation_items;
DROP POLICY IF EXISTS operational_reconciliation_items_update_billing ON public.operational_reconciliation_items;
DROP POLICY IF EXISTS operational_reconciliation_items_delete_billing ON public.operational_reconciliation_items;
DROP POLICY IF EXISTS operational_reconciliation_issues_select_billing ON public.operational_reconciliation_issues;
DROP POLICY IF EXISTS operational_reconciliation_issues_insert_billing ON public.operational_reconciliation_issues;
DROP POLICY IF EXISTS operational_reconciliation_issues_update_billing ON public.operational_reconciliation_issues;
DROP POLICY IF EXISTS operational_reconciliation_audit_select_billing ON public.operational_reconciliation_audit;
DROP POLICY IF EXISTS operational_reconciliation_audit_insert_billing ON public.operational_reconciliation_audit;

CREATE POLICY operational_reconciliations_select_billing
  ON public.operational_reconciliations FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliations_insert_billing
  ON public.operational_reconciliations FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliations_update_billing
  ON public.operational_reconciliations FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_items_select_billing
  ON public.operational_reconciliation_items FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_items_insert_billing
  ON public.operational_reconciliation_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_items_update_billing
  ON public.operational_reconciliation_items FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_items_delete_billing
  ON public.operational_reconciliation_items FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_issues_select_billing
  ON public.operational_reconciliation_issues FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_issues_insert_billing
  ON public.operational_reconciliation_issues FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_issues_update_billing
  ON public.operational_reconciliation_issues FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_audit_select_billing
  ON public.operational_reconciliation_audit FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY operational_reconciliation_audit_insert_billing
  ON public.operational_reconciliation_audit FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

COMMENT ON TABLE public.operational_reconciliations IS
  'Conciliação operacional por competência: esperado vs recebido; base para financeiro futuro.';
COMMENT ON TABLE public.operational_reconciliation_items IS
  'Itens de matching (lote, guia, convênio, competência, repasse) e linhas importadas/manual.';
COMMENT ON TABLE public.operational_reconciliation_issues IS
  'Pendências e divergências detectadas na conferência operacional.';
COMMENT ON TABLE public.operational_reconciliation_audit IS
  'Auditoria append-only: matching, divergências, resoluções e importações.';
