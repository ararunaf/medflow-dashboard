-- MedFlow-IA: portão de revisão humana + versionamento de regra (F2-S3)
-- Sprint: F2-S3 — Portão de revisão humana e versionamento de regra
-- Adiciona os campos de revisão em contract_rule_proposals (quem revisou,
-- quando, com que decisão) e a tabela contract_rule_versions — o registro
-- imutável e auditável de toda regra que efetivamente foi aprovada. Uma
-- regra só existe em contract_rule_versions se um humano aprovou; não há
-- caminho de escrita nesta tabela fora do fluxo de revisão.

-- ---------------------------------------------------------------------------
-- contract_rule_proposals ganha os campos de decisão do revisor
-- ---------------------------------------------------------------------------
ALTER TABLE public.contract_rule_proposals
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS edited_description text,
  ADD COLUMN IF NOT EXISTS edited_justification text;

-- Só uma proposta 'pending' pode ser revisada (USING), e o resultado da
-- revisão precisa ser um estado terminal com reviewed_by/reviewed_at
-- preenchidos pelo próprio autor da requisição (WITH CHECK) — mesmo padrão
-- de guarda dupla usado em outras migrações do projeto (banco rejeita o
-- resto, não só a UI).
DROP POLICY IF EXISTS contract_rule_proposals_update_review ON public.contract_rule_proposals;
CREATE POLICY contract_rule_proposals_update_review
  ON public.contract_rule_proposals FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND status = 'pending'
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND status IN ('approved', 'rejected', 'edited')
    AND reviewed_by = auth.uid()
    AND reviewed_at IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- contract_rule_versions — regra efetivamente aprovada, versionada
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contract_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  operator_contract_id uuid NOT NULL,
  proposal_id uuid,
  rule_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  operator_code text NOT NULL,
  contract_label text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  justification text NOT NULL,
  citation_heading text,
  citation_excerpt text NOT NULL,
  guide_type text NOT NULL DEFAULT '*',
  procedure_type text NOT NULL DEFAULT '*',
  severity text NOT NULL DEFAULT 'medio',
  approved_by uuid NOT NULL REFERENCES public.profiles (id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contract_rule_versions_contract_fk
    FOREIGN KEY (tenant_id, operator_contract_id)
    REFERENCES public.operator_contracts (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT contract_rule_versions_proposal_fk
    FOREIGN KEY (proposal_id) REFERENCES public.contract_rule_proposals (id) ON DELETE SET NULL,
  CONSTRAINT contract_rule_versions_category_chk CHECK (
    category IN ('cobertura', 'preco', 'pre_autorizacao', 'prazo', 'campo_obrigatorio')
  ),
  CONSTRAINT contract_rule_versions_severity_chk CHECK (
    severity IN ('critico', 'alto', 'medio', 'baixo')
  ),
  CONSTRAINT contract_rule_versions_version_uidx UNIQUE (tenant_id, rule_id, version)
);

COMMENT ON TABLE public.contract_rule_versions IS
  'Regras contratuais efetivamente aprovadas por um humano (F2-S3) — imutável, uma linha por versão. Cada proposta aprovada vira a v1 de uma nova regra (rule_id = id da proposta); versionamento de UMA MESMA regra ao longo de recontratos futuros ainda não tem lógica de bump automático — o schema já suporta (unique tenant_id+rule_id+version), a lógica fica para quando o caso real aparecer.';

CREATE INDEX IF NOT EXISTS contract_rule_versions_tenant_id_idx
  ON public.contract_rule_versions (tenant_id);

CREATE INDEX IF NOT EXISTS contract_rule_versions_operator_contract_id_idx
  ON public.contract_rule_versions (operator_contract_id);

CREATE INDEX IF NOT EXISTS contract_rule_versions_rule_id_idx
  ON public.contract_rule_versions (rule_id);

ALTER TABLE public.contract_rule_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_rule_versions_select_tenant ON public.contract_rule_versions;
CREATE POLICY contract_rule_versions_select_tenant
  ON public.contract_rule_versions FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- Só o próprio ato de aprovação cria uma versão — sempre em nome de quem
-- está autenticado (approved_by = auth.uid()), nunca em nome de outrem.
DROP POLICY IF EXISTS contract_rule_versions_insert_review ON public.contract_rule_versions;
CREATE POLICY contract_rule_versions_insert_review
  ON public.contract_rule_versions FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND approved_by = auth.uid()
  );

-- Imutável: nenhuma policy de UPDATE/DELETE para authenticated — uma versão
-- aprovada nunca é editada ou apagada, só superada por uma versão nova.
