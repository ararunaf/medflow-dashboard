-- MedFlow-IA: fundação TISS operacional (convênios, TUSS, guias, lotes, export audit).
-- Multi-tenant + RLS; timeline estendida para auditoria de faturamento.

-- ---------------------------------------------------------------------------
-- Timeline: entidades TISS + eventos auditáveis
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
    'tiss_batch_export'
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
    'tiss_batch_exported'
  )
);

-- ---------------------------------------------------------------------------
-- Helpers RBAC faturamento / TISS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_billing()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN (
    'super_admin',
    'tenant_admin',
    'coordinator',
    'financial'
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_billing() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_billing() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_tuss_catalog()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'tenant_admin', 'coordinator');
$$;

REVOKE ALL ON FUNCTION public.can_manage_tuss_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_tuss_catalog() TO authenticated;

-- ---------------------------------------------------------------------------
-- Enums TISS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_guide_type') THEN
    CREATE TYPE public.tiss_guide_type AS ENUM (
      'consulta',
      'sadt',
      'honorario_individual'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_guide_status') THEN
    CREATE TYPE public.tiss_guide_status AS ENUM (
      'draft',
      'pending_review',
      'approved',
      'billed',
      'denied'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tiss_batch_status') THEN
    CREATE TYPE public.tiss_batch_status AS ENUM (
      'open',
      'closed',
      'exported',
      'processed'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Chaves compostas (tenant_id, id) — alinhado ao domínio operacional
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  ans_code text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS insurance_providers_tenant_id_id_uidx
  ON public.insurance_providers (tenant_id, id);

CREATE INDEX IF NOT EXISTS insurance_providers_tenant_id_idx
  ON public.insurance_providers (tenant_id);

CREATE TABLE IF NOT EXISTS public.insurance_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  insurance_provider_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  contract_number text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT insurance_contracts_tenant_provider_fk
    FOREIGN KEY (tenant_id, insurance_provider_id)
    REFERENCES public.insurance_providers (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS insurance_contracts_tenant_id_id_uidx
  ON public.insurance_contracts (tenant_id, id);

CREATE INDEX IF NOT EXISTS insurance_contracts_tenant_provider_idx
  ON public.insurance_contracts (tenant_id, insurance_provider_id);

CREATE TABLE IF NOT EXISTS public.insurance_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  insurance_contract_id uuid NOT NULL,
  name text NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT insurance_rules_tenant_contract_fk
    FOREIGN KEY (tenant_id, insurance_contract_id)
    REFERENCES public.insurance_contracts (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS insurance_rules_tenant_id_id_uidx
  ON public.insurance_rules (tenant_id, id);

CREATE INDEX IF NOT EXISTS insurance_rules_tenant_contract_idx
  ON public.insurance_rules (tenant_id, insurance_contract_id);

-- TUSS global (catálogo compartilhado; sem tenant)
CREATE TABLE IF NOT EXISTS public.tuss_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL,
  specialty text NOT NULL DEFAULT '',
  operational_group text NOT NULL DEFAULT '',
  default_value numeric(14, 2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tuss_procedures_code_uid UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS tuss_procedures_active_idx ON public.tuss_procedures (active) WHERE active;

CREATE TABLE IF NOT EXISTS public.tiss_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  competence date NOT NULL,
  total_guides integer NOT NULL DEFAULT 0,
  total_value numeric(14, 2) NOT NULL DEFAULT 0,
  status public.tiss_batch_status NOT NULL DEFAULT 'open',
  generated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_batches_tenant_batch_number_uid UNIQUE (tenant_id, batch_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_batches_tenant_id_id_uidx
  ON public.tiss_batches (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_batches_tenant_competence_idx
  ON public.tiss_batches (tenant_id, competence DESC);

CREATE TABLE IF NOT EXISTS public.tiss_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  guide_type public.tiss_guide_type NOT NULL,
  patient_name text NOT NULL,
  insurance_provider_id uuid NOT NULL,
  insurance_contract_id uuid,
  professional_id uuid NOT NULL,
  attendance_date date NOT NULL,
  status public.tiss_guide_status NOT NULL DEFAULT 'draft',
  batch_id uuid,
  total_value numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_guides_tenant_provider_fk
    FOREIGN KEY (tenant_id, insurance_provider_id)
    REFERENCES public.insurance_providers (tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT tiss_guides_tenant_contract_fk
    FOREIGN KEY (tenant_id, insurance_contract_id)
    REFERENCES public.insurance_contracts (tenant_id, id)
    ON DELETE SET NULL,
  CONSTRAINT tiss_guides_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT tiss_guides_tenant_batch_fk
    FOREIGN KEY (tenant_id, batch_id)
    REFERENCES public.tiss_batches (tenant_id, id)
    ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_guides_tenant_id_id_uidx
  ON public.tiss_guides (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_guides_tenant_batch_idx ON public.tiss_guides (tenant_id, batch_id);
CREATE INDEX IF NOT EXISTS tiss_guides_tenant_status_idx ON public.tiss_guides (tenant_id, status);

CREATE TABLE IF NOT EXISTS public.tiss_guide_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  guide_id uuid NOT NULL,
  procedure_id uuid NOT NULL REFERENCES public.tuss_procedures (id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_value numeric(14, 2) NOT NULL CHECK (unit_value >= 0),
  total_value numeric(14, 2) NOT NULL CHECK (total_value >= 0),
  execution_date date NOT NULL,
  CONSTRAINT tiss_guide_items_tenant_guide_fk
    FOREIGN KEY (tenant_id, guide_id)
    REFERENCES public.tiss_guides (tenant_id, id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_guide_items_tenant_id_id_uidx
  ON public.tiss_guide_items (tenant_id, id);

CREATE INDEX IF NOT EXISTS tiss_guide_items_guide_idx ON public.tiss_guide_items (tenant_id, guide_id);

-- Auditoria de exportação (metadados; XML completo fica no app / download)
CREATE TABLE IF NOT EXISTS public.tiss_batch_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  batch_id uuid NOT NULL,
  exported_by_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  checksum_sha256 text NOT NULL,
  byte_length integer NOT NULL CHECK (byte_length >= 0),
  preview text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tiss_batch_exports_tenant_batch_fk
    FOREIGN KEY (tenant_id, batch_id)
    REFERENCES public.tiss_batches (tenant_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tiss_batch_exports_tenant_batch_idx
  ON public.tiss_batch_exports (tenant_id, batch_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Gatilho: total da guia a partir dos itens (sem recalcular lotes aqui)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tiss_recalc_guide_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  gid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    tid := OLD.tenant_id;
    gid := OLD.guide_id;
  ELSE
    tid := NEW.tenant_id;
    gid := NEW.guide_id;
  END IF;

  UPDATE public.tiss_guides g
  SET
    total_value = COALESCE(
      (SELECT SUM(i.total_value) FROM public.tiss_guide_items i WHERE i.tenant_id = tid AND i.guide_id = gid),
      0
    ),
    updated_at = now()
  WHERE g.tenant_id = tid AND g.id = gid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tiss_guide_items_recalc_guide_total_ins ON public.tiss_guide_items;
CREATE TRIGGER tiss_guide_items_recalc_guide_total_ins
  AFTER INSERT ON public.tiss_guide_items
  FOR EACH ROW EXECUTE FUNCTION public.tiss_recalc_guide_total();

DROP TRIGGER IF EXISTS tiss_guide_items_recalc_guide_total_upd ON public.tiss_guide_items;
CREATE TRIGGER tiss_guide_items_recalc_guide_total_upd
  AFTER UPDATE ON public.tiss_guide_items
  FOR EACH ROW EXECUTE FUNCTION public.tiss_recalc_guide_total();

DROP TRIGGER IF EXISTS tiss_guide_items_recalc_guide_total_del ON public.tiss_guide_items;
CREATE TRIGGER tiss_guide_items_recalc_guide_total_del
  AFTER DELETE ON public.tiss_guide_items
  FOR EACH ROW EXECUTE FUNCTION public.tiss_recalc_guide_total();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuss_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_guide_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_batch_exports ENABLE ROW LEVEL SECURITY;

-- insurance_providers
CREATE POLICY insurance_providers_select_tenant
  ON public.insurance_providers FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY insurance_providers_write_billing
  ON public.insurance_providers FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- insurance_contracts
CREATE POLICY insurance_contracts_select_tenant
  ON public.insurance_contracts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY insurance_contracts_write_billing
  ON public.insurance_contracts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- insurance_rules
CREATE POLICY insurance_rules_select_tenant
  ON public.insurance_rules FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY insurance_rules_write_billing
  ON public.insurance_rules FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- tuss_procedures (leitura ampla; escrita gestores + coordenação)
CREATE POLICY tuss_procedures_select_auth
  ON public.tuss_procedures FOR SELECT TO authenticated
  USING (true);

CREATE POLICY tuss_procedures_write_catalog
  ON public.tuss_procedures FOR ALL TO authenticated
  USING (public.can_manage_tuss_catalog())
  WITH CHECK (public.can_manage_tuss_catalog());

-- tiss_batches
CREATE POLICY tiss_batches_select_tenant
  ON public.tiss_batches FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_batches_write_billing
  ON public.tiss_batches FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- tiss_guides
CREATE POLICY tiss_guides_select_tenant
  ON public.tiss_guides FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_guides_insert_billing
  ON public.tiss_guides FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

CREATE POLICY tiss_guides_update_billing
  ON public.tiss_guides FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY tiss_guides_delete_billing
  ON public.tiss_guides FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- tiss_guide_items
CREATE POLICY tiss_guide_items_select_tenant
  ON public.tiss_guide_items FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_guide_items_write_billing
  ON public.tiss_guide_items FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

-- tiss_batch_exports
CREATE POLICY tiss_batch_exports_select_tenant
  ON public.tiss_batch_exports FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tiss_batch_exports_insert_billing
  ON public.tiss_batch_exports FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND exported_by_profile_id = auth.uid()
  );

COMMENT ON TABLE public.insurance_providers IS 'Convênios operacionais (ANS) por tenant.';
COMMENT ON TABLE public.tuss_procedures IS 'Catálogo TUSS compartilhado (sem tenant).';
COMMENT ON TABLE public.tiss_guides IS 'Guias TISS operacionais; preparação para lote e glosa.';
COMMENT ON TABLE public.tiss_batches IS 'Lotes de faturamento; totais materializados por lote.';
COMMENT ON TABLE public.tiss_batch_exports IS 'Trilha de exportação XML (checksum, tamanho, preview).';

INSERT INTO public.tuss_procedures (code, description, specialty, operational_group, default_value)
VALUES
  (
    '10101012',
    'Consulta em consultório (no horário normal ou preestabelecido)',
    'Clínica médica',
    'CONSULTAS',
    100.00
  ),
  (
    '40304361',
    'Hemograma com contagem de plaquetas ou frações eritrocitárias',
    'Patologia clínica',
    'SADT',
    35.00
  )
ON CONFLICT (code) DO NOTHING;
