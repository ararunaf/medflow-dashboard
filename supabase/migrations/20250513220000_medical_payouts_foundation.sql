-- MedFlow-IA: produção médica, regras de repasse, repasses operacionais, itens, auditoria.
-- Alinhado a TISS (guias, lotes, glosas), multi-tenant, RLS via can_manage_billing / tenant.
-- Não inclui contabilidade fiscal, DRE ou ERP.

-- ---------------------------------------------------------------------------
-- Timeline operacional (entidades e eventos de repasse)
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
    'payout_rule'
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
    'payout_rule_updated'
  )
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_rule_type') THEN
    CREATE TYPE public.payout_rule_type AS ENUM (
      'percentage',
      'fixed',
      'operational_discount',
      'retention_percentage',
      'retention_fixed'
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_payout_status') THEN
    CREATE TYPE public.medical_payout_status AS ENUM (
      'draft',
      'calculated',
      'reviewed',
      'approved',
      'paid'
    );
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- Produção médica (consolidado por guia / competência)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_production (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  guide_id uuid NOT NULL,
  batch_id uuid,
  competence_month date NOT NULL,
  gross_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (gross_value >= 0),
  denied_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (denied_value >= 0),
  approved_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (approved_value >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medical_production_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT medical_production_tenant_guide_fk
    FOREIGN KEY (tenant_id, guide_id)
    REFERENCES public.tiss_guides (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT medical_production_tenant_batch_fk
    FOREIGN KEY (tenant_id, batch_id)
    REFERENCES public.tiss_batches (tenant_id, id)
    ON DELETE SET NULL,
  CONSTRAINT medical_production_tenant_guide_uid UNIQUE (tenant_id, guide_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_production_tenant_id_id_uidx
  ON public.medical_production (tenant_id, id);

CREATE INDEX IF NOT EXISTS medical_production_tenant_competence_idx
  ON public.medical_production (tenant_id, competence_month DESC);

CREATE INDEX IF NOT EXISTS medical_production_tenant_professional_idx
  ON public.medical_production (tenant_id, professional_id, competence_month DESC);

-- ---------------------------------------------------------------------------
-- Regras de repasse / retenção (MVP operacional)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  professional_id uuid,
  specialty text NOT NULL DEFAULT '',
  insurance_provider_id uuid,
  payout_type public.payout_rule_type NOT NULL,
  payout_percentage numeric(7, 4),
  fixed_value numeric(14, 2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payout_rules_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT payout_rules_tenant_provider_fk
    FOREIGN KEY (tenant_id, insurance_provider_id)
    REFERENCES public.insurance_providers (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT payout_rules_percentage_chk CHECK (
    payout_type NOT IN ('percentage', 'retention_percentage')
    OR (payout_percentage IS NOT NULL AND payout_percentage >= 0 AND payout_percentage <= 100)
  ),
  CONSTRAINT payout_rules_fixed_chk CHECK (
    payout_type NOT IN ('fixed', 'operational_discount', 'retention_fixed')
    OR (fixed_value IS NOT NULL AND fixed_value >= 0)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS payout_rules_tenant_id_id_uidx
  ON public.payout_rules (tenant_id, id);

CREATE INDEX IF NOT EXISTS payout_rules_tenant_active_idx
  ON public.payout_rules (tenant_id, active) WHERE active;

-- ---------------------------------------------------------------------------
-- Repasse por profissional / competência
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  competence_month date NOT NULL,
  gross_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (gross_value >= 0),
  denied_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (denied_value >= 0),
  net_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (net_value >= 0),
  retention_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (retention_value >= 0),
  final_value numeric(14, 2) NOT NULL DEFAULT 0,
  status public.medical_payout_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medical_payouts_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT medical_payouts_tenant_professional_competence_uid
    UNIQUE (tenant_id, professional_id, competence_month)
);

CREATE UNIQUE INDEX IF NOT EXISTS medical_payouts_tenant_id_id_uidx
  ON public.medical_payouts (tenant_id, id);

CREATE INDEX IF NOT EXISTS medical_payouts_tenant_competence_idx
  ON public.medical_payouts (tenant_id, competence_month DESC, status);

-- ---------------------------------------------------------------------------
-- Itens de repasse (ligação produção ↔ payout)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL,
  production_id uuid NOT NULL,
  guide_id uuid NOT NULL,
  approved_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (approved_value >= 0),
  denied_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (denied_value >= 0),
  calculated_value numeric(14, 2) NOT NULL DEFAULT 0 CHECK (calculated_value >= 0),
  CONSTRAINT medical_payout_items_payout_fk
    FOREIGN KEY (payout_id)
    REFERENCES public.medical_payouts (id)
    ON DELETE CASCADE,
  CONSTRAINT medical_payout_items_production_fk
    FOREIGN KEY (production_id)
    REFERENCES public.medical_production (id)
    ON DELETE RESTRICT,
  CONSTRAINT medical_payout_items_payout_production_uid UNIQUE (payout_id, production_id)
);

CREATE INDEX IF NOT EXISTS medical_payout_items_payout_idx
  ON public.medical_payout_items (payout_id);

-- ---------------------------------------------------------------------------
-- Auditoria granular de repasses (complementa operational_events)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_payout_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  payout_id uuid NOT NULL,
  action text NOT NULL,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medical_payout_audit_payout_fk
    FOREIGN KEY (payout_id)
    REFERENCES public.medical_payouts (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS medical_payout_audit_tenant_payout_idx
  ON public.medical_payout_audit (tenant_id, payout_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.medical_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_payout_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY medical_production_select_tenant
  ON public.medical_production FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY medical_production_write_billing
  ON public.medical_production FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY payout_rules_select_tenant
  ON public.payout_rules FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY payout_rules_write_billing
  ON public.payout_rules FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY medical_payouts_select_tenant
  ON public.medical_payouts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY medical_payouts_write_billing
  ON public.medical_payouts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.can_manage_billing());

CREATE POLICY medical_payout_items_select_tenant
  ON public.medical_payout_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_payouts p
      WHERE p.id = medical_payout_items.payout_id
        AND p.tenant_id IN (SELECT public.current_tenant_ids())
    )
  );

CREATE POLICY medical_payout_items_write_billing
  ON public.medical_payout_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_payouts p
      WHERE p.id = medical_payout_items.payout_id
        AND p.tenant_id IN (SELECT public.current_tenant_ids())
        AND public.can_manage_billing()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medical_payouts p
      WHERE p.id = medical_payout_items.payout_id
        AND p.tenant_id IN (SELECT public.current_tenant_ids())
        AND public.can_manage_billing()
    )
  );

CREATE POLICY medical_payout_audit_select_tenant
  ON public.medical_payout_audit FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY medical_payout_audit_insert_billing
  ON public.medical_payout_audit FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.medical_production IS 'Produção médica consolidada por guia e competência (base para repasse).';
COMMENT ON TABLE public.payout_rules IS 'Regras de repasse e retenções operacionais básicas por tenant.';
COMMENT ON TABLE public.medical_payouts IS 'Repasse operacional por profissional e competência (status até pagamento).';
COMMENT ON TABLE public.medical_payout_items IS 'Itens de repasse amarrados à produção e guia TISS.';
COMMENT ON TABLE public.medical_payout_audit IS 'Auditoria de cálculo, revisão, aprovação e pagamento de repasses.';
