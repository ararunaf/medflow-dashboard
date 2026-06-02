-- MedFlow-IA: retornos TISS, glosas (denials), recursos, auditoria e rollups incrementais.
-- Não inclui financeiro contábil completo; rollups evitam recomputo global em tempo de leitura.

-- ---------------------------------------------------------------------------
-- Timeline: entidades e eventos auditáveis (glosas / retornos)
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
    'tiss_denial_appeal'
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
    'tiss_denial_appeal_updated'
  )
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_return_status') THEN
    CREATE TYPE public.tiss_return_status AS ENUM (
      'received',
      'processing',
      'processed',
      'failed'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_denial_type') THEN
    CREATE TYPE public.tiss_denial_type AS ENUM (
      'partial',
      'total',
      'administrative',
      'technical'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_denial_status') THEN
    CREATE TYPE public.tiss_denial_status AS ENUM (
      'identified',
      'under_review',
      'appealed',
      'reversed',
      'accepted'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_appeal_status') THEN
    CREATE TYPE public.tiss_appeal_status AS ENUM (
      'pending',
      'submitted',
      'under_review',
      'accepted',
      'rejected',
      'withdrawn'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Retorno TISS (lote / referência operacional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiss_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  batch_id uuid NOT NULL,
  return_reference text NOT NULL,
  processed_at timestamptz,
  status public.tiss_return_status NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_returns_tenant_batch_fk
    FOREIGN KEY (tenant_id, batch_id)
    REFERENCES public.tiss_batches (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tiss_returns_tenant_reference_uid UNIQUE (tenant_id, return_reference)
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_returns_tenant_id_id_uidx
  ON public.tiss_returns (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_returns_tenant_batch_idx
  ON public.tiss_returns (tenant_id, batch_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Glosas (negações)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiss_denials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  return_id uuid NOT NULL,
  guide_id uuid NOT NULL,
  denial_type public.tiss_denial_type NOT NULL,
  denial_reason_code text NOT NULL DEFAULT '',
  denial_reason_description text NOT NULL DEFAULT '',
  denied_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (denied_value >= 0),
  status public.tiss_denial_status NOT NULL DEFAULT 'identified',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_denials_tenant_return_fk
    FOREIGN KEY (tenant_id, return_id)
    REFERENCES public.tiss_returns (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT tiss_denials_tenant_guide_fk
    FOREIGN KEY (tenant_id, guide_id)
    REFERENCES public.tiss_guides (tenant_id, id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_denials_tenant_id_id_uidx
  ON public.tiss_denials (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_denials_tenant_return_idx
  ON public.tiss_denials (tenant_id, return_id);

CREATE INDEX IF NOT EXISTS tiss_denials_tenant_guide_idx
  ON public.tiss_denials (tenant_id, guide_id);

CREATE INDEX IF NOT EXISTS tiss_denials_tenant_status_idx
  ON public.tiss_denials (tenant_id, status);

-- ---------------------------------------------------------------------------
-- Recursos de glosa
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiss_denial_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  denial_id uuid NOT NULL,
  appeal_reason text NOT NULL DEFAULT '',
  appeal_status public.tiss_appeal_status NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_denial_appeals_tenant_denial_fk
    FOREIGN KEY (tenant_id, denial_id)
    REFERENCES public.tiss_denials (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_denial_appeals_tenant_id_id_uidx
  ON public.tiss_denial_appeals (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_denial_appeals_tenant_denial_idx
  ON public.tiss_denial_appeals (tenant_id, denial_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Auditoria granular de glosa (além da timeline operacional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiss_denial_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  denial_id uuid NOT NULL,
  action text NOT NULL,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_denial_audit_tenant_denial_fk
    FOREIGN KEY (tenant_id, denial_id)
    REFERENCES public.tiss_denials (tenant_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tiss_denial_audit_tenant_denial_idx
  ON public.tiss_denial_audit (tenant_id, denial_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Rollups incrementais (exposição glosada: tudo exceto reversed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tiss_denial_financial_rollups (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  bucket text NOT NULL CHECK (bucket IN ('tenant', 'insurance_provider', 'professional', 'batch')),
  bucket_id uuid NOT NULL,
  competence_month date NOT NULL,
  denied_exposure numeric(14, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, bucket, bucket_id, competence_month)
);

CREATE INDEX IF NOT EXISTS tiss_denial_financial_rollups_tenant_month_idx
  ON public.tiss_denial_financial_rollups (tenant_id, competence_month DESC);

CREATE TABLE IF NOT EXISTS public.tiss_denial_reason_rollups (
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  competence_month date NOT NULL,
  denial_reason_code text NOT NULL,
  denied_exposure numeric(14, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, competence_month, denial_reason_code)
);

CREATE OR REPLACE FUNCTION public.tiss_denial_exposure(p_status public.tiss_denial_status, p_value numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_status = 'reversed' THEN 0::numeric
    ELSE COALESCE(p_value, 0)
  END;
$$;

CREATE OR REPLACE FUNCTION public.tiss_denial_financial_rollup_add(
  p_tenant_id uuid,
  p_bucket text,
  p_bucket_id uuid,
  p_month date,
  p_delta numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_delta = 0 OR p_bucket_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.tiss_denial_financial_rollups AS r (
    tenant_id, bucket, bucket_id, competence_month, denied_exposure, updated_at
  )
  VALUES (p_tenant_id, p_bucket, p_bucket_id, p_month, p_delta, now())
  ON CONFLICT (tenant_id, bucket, bucket_id, competence_month)
  DO UPDATE SET
    denied_exposure = GREATEST(0, r.denied_exposure + EXCLUDED.denied_exposure),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.tiss_denial_reason_rollup_add(
  p_tenant_id uuid,
  p_month date,
  p_reason text,
  p_delta numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  rc text := COALESCE(NULLIF(trim(p_reason), ''), '_sem_codigo');
BEGIN
  IF p_delta = 0 THEN
    RETURN;
  END IF;
  INSERT INTO public.tiss_denial_reason_rollups AS r (
    tenant_id, competence_month, denial_reason_code, denied_exposure, updated_at
  )
  VALUES (p_tenant_id, p_month, rc, p_delta, now())
  ON CONFLICT (tenant_id, competence_month, denial_reason_code)
  DO UPDATE SET
    denied_exposure = GREATEST(0, r.denied_exposure + EXCLUDED.denied_exposure),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.tiss_denials_apply_rollup_delta(
  p_tenant_id uuid,
  p_guide_id uuid,
  p_old_reason text,
  p_new_reason text,
  p_old_exposure numeric,
  p_new_exposure numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  g record;
  m date;
  d_total numeric := p_new_exposure - p_old_exposure;
BEGIN
  IF d_total = 0
    AND p_old_reason IS NOT DISTINCT FROM p_new_reason
    AND p_old_exposure IS NOT DISTINCT FROM p_new_exposure THEN
    RETURN;
  END IF;

  SELECT
    tenant_id,
    insurance_provider_id,
    professional_id,
    batch_id,
    (date_trunc('month', attendance_date::timestamp AT TIME ZONE 'UTC'))::date AS competence_month
  INTO g
  FROM public.tiss_guides
  WHERE tenant_id = p_tenant_id AND id = p_guide_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  m := g.competence_month;

  IF d_total <> 0 THEN
    PERFORM public.tiss_denial_financial_rollup_add(p_tenant_id, 'tenant', p_tenant_id, m, d_total);
    PERFORM public.tiss_denial_financial_rollup_add(p_tenant_id, 'insurance_provider', g.insurance_provider_id, m, d_total);
    PERFORM public.tiss_denial_financial_rollup_add(p_tenant_id, 'professional', g.professional_id, m, d_total);
    IF g.batch_id IS NOT NULL THEN
      PERFORM public.tiss_denial_financial_rollup_add(p_tenant_id, 'batch', g.batch_id, m, d_total);
    END IF;
  END IF;

  IF p_old_exposure <> 0 THEN
    PERFORM public.tiss_denial_reason_rollup_add(p_tenant_id, m, p_old_reason, -p_old_exposure);
  END IF;
  IF p_new_exposure <> 0 THEN
    PERFORM public.tiss_denial_reason_rollup_add(p_tenant_id, m, p_new_reason, p_new_exposure);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tiss_denials_rollups_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  old_ex numeric;
  new_ex numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_ex := public.tiss_denial_exposure(OLD.status, OLD.denied_value);
    IF old_ex <> 0 THEN
      PERFORM public.tiss_denials_apply_rollup_delta(
        OLD.tenant_id,
        OLD.guide_id,
        OLD.denial_reason_code,
        OLD.denial_reason_code,
        old_ex,
        0
      );
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_ex := public.tiss_denial_exposure(OLD.status, OLD.denied_value);
    new_ex := public.tiss_denial_exposure(NEW.status, NEW.denied_value);
    IF OLD.guide_id IS DISTINCT FROM NEW.guide_id THEN
      IF old_ex <> 0 THEN
        PERFORM public.tiss_denials_apply_rollup_delta(
          OLD.tenant_id,
          OLD.guide_id,
          OLD.denial_reason_code,
          OLD.denial_reason_code,
          old_ex,
          0
        );
      END IF;
      IF new_ex <> 0 THEN
        PERFORM public.tiss_denials_apply_rollup_delta(
          NEW.tenant_id,
          NEW.guide_id,
          NEW.denial_reason_code,
          NEW.denial_reason_code,
          0,
          new_ex
        );
      END IF;
    ELSE
      PERFORM public.tiss_denials_apply_rollup_delta(
        NEW.tenant_id,
        NEW.guide_id,
        OLD.denial_reason_code,
        NEW.denial_reason_code,
        old_ex,
        new_ex
      );
    END IF;
    RETURN NEW;
  ELSE
    new_ex := public.tiss_denial_exposure(NEW.status, NEW.denied_value);
    PERFORM public.tiss_denials_apply_rollup_delta(
      NEW.tenant_id,
      NEW.guide_id,
      NEW.denial_reason_code,
      NEW.denial_reason_code,
      0,
      new_ex
    );
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS tiss_denials_rollups_ins ON public.tiss_denials;
CREATE TRIGGER tiss_denials_rollups_ins
  AFTER INSERT ON public.tiss_denials
  FOR EACH ROW EXECUTE FUNCTION public.tiss_denials_rollups_trigger();

DROP TRIGGER IF EXISTS tiss_denials_rollups_upd ON public.tiss_denials;
CREATE TRIGGER tiss_denials_rollups_upd
  AFTER UPDATE ON public.tiss_denials
  FOR EACH ROW EXECUTE FUNCTION public.tiss_denials_rollups_trigger();

DROP TRIGGER IF EXISTS tiss_denials_rollups_del ON public.tiss_denials;
CREATE TRIGGER tiss_denials_rollups_del
  AFTER DELETE ON public.tiss_denials
  FOR EACH ROW EXECUTE FUNCTION public.tiss_denials_rollups_trigger();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.tiss_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_denial_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_denial_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_denial_financial_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_denial_reason_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY tiss_returns_select_tenant
  ON public.tiss_returns FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_returns_write_billing
  ON public.tiss_returns FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY tiss_denials_select_tenant
  ON public.tiss_denials FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_denials_write_billing
  ON public.tiss_denials FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY tiss_denial_appeals_select_tenant
  ON public.tiss_denial_appeals FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_denial_appeals_write_billing
  ON public.tiss_denial_appeals FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY tiss_denial_audit_select_tenant
  ON public.tiss_denial_audit FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_denial_audit_insert_billing
  ON public.tiss_denial_audit FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND actor_profile_id = auth.uid()
  );

CREATE POLICY tiss_denial_financial_rollups_select_tenant
  ON public.tiss_denial_financial_rollups FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_denial_reason_rollups_select_tenant
  ON public.tiss_denial_reason_rollups FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

COMMENT ON TABLE public.tiss_returns IS 'Retorno operacional TISS vinculado ao lote; referência externa e processamento.';
COMMENT ON TABLE public.tiss_denials IS 'Glosas / negações por guia e retorno; status de ciclo operacional.';
COMMENT ON TABLE public.tiss_denial_appeals IS 'Recursos administrativos de glosa (MVP; integração futura com operadora).';
COMMENT ON TABLE public.tiss_denial_audit IS 'Auditoria de faturamento: mutações de glosa e recursos com payload JSON.';
COMMENT ON TABLE public.tiss_denial_financial_rollups IS 'Exposição glosada incremental por tenant, convênio, profissional e lote.';
COMMENT ON TABLE public.tiss_denial_reason_rollups IS 'Ranking de motivos (código) por competência — atualização incremental.';
