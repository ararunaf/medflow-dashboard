-- MedFlow-IA: fechamento financeiro operacional por competência, snapshots, auditoria e lock.
-- Integra produção médica, repasses TISS e timeline; prepara conciliação futura (sem DRE/ERP/banco).

-- ---------------------------------------------------------------------------
-- Timeline: fechamento financeiro
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
    'financial_closing'
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
    'financial_closing_reopened'
  )
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_closing_status') THEN
    CREATE TYPE public.financial_closing_status AS ENUM (
      'draft',
      'under_review',
      'validated',
      'locked',
      'finalized'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_closing_snapshot_type') THEN
    CREATE TYPE public.financial_closing_snapshot_type AS ENUM (
      'consolidation_summary',
      'payout_crosscheck',
      'pre_reconciliation_marker',
      'lock_checkpoint'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Fechamento por competência (consolidado; não recalcula após lock no app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  competence_month date NOT NULL,
  total_guides integer NOT NULL DEFAULT 0 CHECK (total_guides >= 0),
  total_billed numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_billed >= 0),
  total_denied numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_denied >= 0),
  total_approved numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_approved >= 0),
  total_payouts numeric(14, 2) NOT NULL DEFAULT 0,
  operational_difference numeric(14, 2) NOT NULL DEFAULT 0,
  status public.financial_closing_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_closings_tenant_competence_uid UNIQUE (tenant_id, competence_month)
);

CREATE UNIQUE INDEX IF NOT EXISTS financial_closings_tenant_id_id_uidx
  ON public.financial_closings (tenant_id, id);

CREATE INDEX IF NOT EXISTS financial_closings_tenant_status_idx
  ON public.financial_closings (tenant_id, status, competence_month DESC);

-- ---------------------------------------------------------------------------
-- Snapshots (payload resumido; evita documentos gigantes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_closing_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id uuid NOT NULL REFERENCES public.financial_closings (id) ON DELETE CASCADE,
  snapshot_type public.financial_closing_snapshot_type NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_closing_snapshots_payload_size_chk
    CHECK (octet_length(payload_json::text) <= 120000)
);

CREATE INDEX IF NOT EXISTS financial_closing_snapshots_closing_idx
  ON public.financial_closing_snapshots (closing_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Auditoria dedicada (fechamento, validação, lock, unlock, alterações)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_closing_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  closing_id uuid NOT NULL REFERENCES public.financial_closings (id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_closing_audit_closing_idx
  ON public.financial_closing_audit (closing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS financial_closing_audit_tenant_idx
  ON public.financial_closing_audit (tenant_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpers e travamento de competência (finalized)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.financial_closing_competence_is_immutable(
  p_tenant_id uuid,
  p_competence_month date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.financial_closings c
    WHERE c.tenant_id = p_tenant_id
      AND c.competence_month = p_competence_month
      AND c.status IN ('locked', 'finalized')
  );
$$;

REVOKE ALL ON FUNCTION public.financial_closing_competence_is_immutable(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.financial_closing_competence_is_immutable(uuid, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_financial_block_medical_production_when_finalized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  cm date;
BEGIN
  tid := COALESCE(NEW.tenant_id, OLD.tenant_id);
  cm := COALESCE(NEW.competence_month, OLD.competence_month);
  IF public.financial_closing_competence_is_immutable(tid, cm) THEN
    RAISE EXCEPTION 'Competência com fechamento travado ou finalizado: alteração em medical_production bloqueada.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS financial_block_medical_production_when_finalized ON public.medical_production;
CREATE TRIGGER financial_block_medical_production_when_finalized
  BEFORE INSERT OR UPDATE OR DELETE ON public.medical_production
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_financial_block_medical_production_when_finalized();

CREATE OR REPLACE FUNCTION public.trg_financial_block_medical_payouts_when_finalized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  cm date;
BEGIN
  tid := COALESCE(NEW.tenant_id, OLD.tenant_id);
  cm := COALESCE(NEW.competence_month, OLD.competence_month);
  IF public.financial_closing_competence_is_immutable(tid, cm) THEN
    RAISE EXCEPTION 'Competência com fechamento travado ou finalizado: alteração em medical_payouts bloqueada.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS financial_block_medical_payouts_when_finalized ON public.medical_payouts;
CREATE TRIGGER financial_block_medical_payouts_when_finalized
  BEFORE INSERT OR UPDATE OR DELETE ON public.medical_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_financial_block_medical_payouts_when_finalized();

CREATE OR REPLACE FUNCTION public.trg_financial_block_tiss_guide_when_finalized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  gid uuid;
  tid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    gid := OLD.id;
    tid := OLD.tenant_id;
  ELSE
    gid := NEW.id;
    tid := NEW.tenant_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.medical_production mp
    WHERE mp.tenant_id = tid
      AND mp.guide_id = gid
      AND public.financial_closing_competence_is_immutable(mp.tenant_id, mp.competence_month)
  ) THEN
    RAISE EXCEPTION 'Competência com fechamento travado ou finalizado: alteração em guia TISS vinculada à produção bloqueada.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS financial_block_tiss_guide_when_finalized ON public.tiss_guides;
CREATE TRIGGER financial_block_tiss_guide_when_finalized
  BEFORE UPDATE OR DELETE ON public.tiss_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_financial_block_tiss_guide_when_finalized();

CREATE OR REPLACE FUNCTION public.trg_financial_block_tiss_guide_items_when_finalized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  gid uuid;
  tid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    gid := OLD.guide_id;
    tid := OLD.tenant_id;
  ELSE
    gid := NEW.guide_id;
    tid := NEW.tenant_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.medical_production mp
    WHERE mp.tenant_id = tid
      AND mp.guide_id = gid
      AND public.financial_closing_competence_is_immutable(mp.tenant_id, mp.competence_month)
  ) THEN
    RAISE EXCEPTION 'Competência com fechamento travado ou finalizado: alteração em itens de guia bloqueada.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS financial_block_tiss_guide_items_when_finalized ON public.tiss_guide_items;
CREATE TRIGGER financial_block_tiss_guide_items_when_finalized
  BEFORE INSERT OR UPDATE OR DELETE ON public.tiss_guide_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_financial_block_tiss_guide_items_when_finalized();

-- Reabrir status finalized: apenas super_admin / tenant_admin
CREATE OR REPLACE FUNCTION public.trg_financial_closings_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'finalized'::public.financial_closing_status
     AND NEW.status IS DISTINCT FROM OLD.status::public.financial_closing_status THEN
    IF public.current_user_role() NOT IN ('super_admin', 'tenant_admin') THEN
      RAISE EXCEPTION 'Somente administrador do tenant pode reabrir fechamento finalizado.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF OLD.status = 'locked'::public.financial_closing_status
     AND NEW.status IS DISTINCT FROM OLD.status::public.financial_closing_status
     AND NEW.status <> 'finalized'::public.financial_closing_status THEN
    IF public.current_user_role() NOT IN ('super_admin', 'tenant_admin') THEN
      RAISE EXCEPTION 'Somente administrador do tenant pode desbloquear fechamento travado.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS financial_closings_status_guard ON public.financial_closings;
CREATE TRIGGER financial_closings_status_guard
  BEFORE UPDATE ON public.financial_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_financial_closings_status_guard();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.financial_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_closing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_closing_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY financial_closings_select_tenant
  ON public.financial_closings FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY financial_closings_write_billing
  ON public.financial_closings FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY financial_closing_snapshots_select_tenant
  ON public.financial_closing_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.financial_closings c
      WHERE c.id = financial_closing_snapshots.closing_id
        AND c.tenant_id IN (SELECT public.current_tenant_ids())
    )
  );

CREATE POLICY financial_closing_snapshots_write_billing
  ON public.financial_closing_snapshots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.financial_closings c
      WHERE c.id = financial_closing_snapshots.closing_id
        AND c.tenant_id IN (SELECT public.current_tenant_ids())
        AND public.can_manage_billing()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.financial_closings c
      WHERE c.id = financial_closing_snapshots.closing_id
        AND c.tenant_id IN (SELECT public.current_tenant_ids())
        AND public.can_manage_billing()
    )
  );

CREATE POLICY financial_closing_audit_select_tenant
  ON public.financial_closing_audit FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY financial_closing_audit_insert_billing
  ON public.financial_closing_audit FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.financial_closings IS 'Fechamento financeiro operacional por competência (TISS + produção + repasses).';
COMMENT ON TABLE public.financial_closing_snapshots IS 'Snapshots resumidos para auditoria e preparação de conciliação futura.';
COMMENT ON TABLE public.financial_closing_audit IS 'Auditoria de ciclo de vida do fechamento (validação, lock, unlock, reabertura).';
