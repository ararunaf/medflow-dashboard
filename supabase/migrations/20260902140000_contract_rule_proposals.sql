-- MedFlow-IA: propostas de regra contratual do Contract Knowledge Agent (F2-S2)
-- Sprint: F2-S2 — Contract Knowledge Agent — extração estruturada
-- O agente lê os chunks indexados em F2-S1 (knowledge_embeddings,
-- domain='contract') e grava aqui propostas de regra com citação
-- verificável. Ainda não é uma ContractRule de produção — o portão de
-- revisão humana (F2-S3) aprova/edita/rejeita antes de virar uma versão
-- real do ContractKnowledgeRegistry (src/lib/capture/contract/).

-- Retrofit: operator_contracts precisava do índice único (tenant_id, id)
-- para servir de alvo de FK composta tenant-scoped, mesmo padrão de
-- capture_pages/capture_fields (20260703120000).
CREATE UNIQUE INDEX IF NOT EXISTS operator_contracts_tenant_id_id_uidx
  ON public.operator_contracts (tenant_id, id);

-- ---------------------------------------------------------------------------
-- match_knowledge_embeddings ganha filtro opcional por document_id — F2-S2
-- precisa restringir a busca RAG a UM contrato específico (document_id =
-- operator_contracts.id), não só por domain/classification (que misturaria
-- chunks de contratos diferentes da mesma operadora). DROP explícito antes
-- do CREATE porque adicionar parâmetro muda a assinatura da função
-- (criaria uma sobrecarga duplicada em vez de substituir, se só usássemos
-- CREATE OR REPLACE).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.match_knowledge_embeddings(
  extensions.vector, int, text, text, float
);

CREATE OR REPLACE FUNCTION public.match_knowledge_embeddings(
  query_embedding extensions.vector(1536),
  match_count int DEFAULT 10,
  filter_domain text DEFAULT NULL,
  filter_classification text DEFAULT NULL,
  similarity_threshold float DEFAULT 0.0,
  filter_document_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id text,
  domain text,
  classification text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    ke.id,
    ke.document_id,
    ke.domain,
    ke.classification,
    ke.content,
    ke.metadata,
    (1 - (ke.embedding <=> query_embedding))::float AS similarity
  FROM public.knowledge_embeddings ke
  WHERE ke.embedding IS NOT NULL
    AND (filter_domain IS NULL OR ke.domain = filter_domain)
    AND (filter_classification IS NULL OR ke.classification = filter_classification)
    AND (filter_document_id IS NULL OR ke.document_id = filter_document_id)
    AND (
      ke.tenant_id IS NULL
      OR ke.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND (1 - (ke.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

REVOKE ALL ON FUNCTION public.match_knowledge_embeddings(
  extensions.vector, int, text, text, float, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_embeddings(
  extensions.vector, int, text, text, float, text
) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.contract_rule_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  operator_contract_id uuid NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  justification text NOT NULL,
  citation_heading text,
  citation_excerpt text NOT NULL,
  source_chunk_ids uuid[] NOT NULL DEFAULT '{}',
  confidence numeric NOT NULL,
  extraction_model text NOT NULL,
  suggested_guide_type text,
  suggested_procedure_type text,
  suggested_severity text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contract_rule_proposals_contract_fk
    FOREIGN KEY (tenant_id, operator_contract_id)
    REFERENCES public.operator_contracts (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT contract_rule_proposals_category_chk CHECK (
    category IN ('cobertura', 'preco', 'pre_autorizacao', 'prazo', 'campo_obrigatorio')
  ),
  CONSTRAINT contract_rule_proposals_confidence_chk CHECK (confidence >= 0 AND confidence <= 100),
  CONSTRAINT contract_rule_proposals_status_chk CHECK (
    status IN ('pending', 'approved', 'rejected', 'edited')
  )
);

COMMENT ON TABLE public.contract_rule_proposals IS
  'Propostas de regra contratual extraídas pelo Contract Knowledge Agent (F2-S2), pendentes de revisão humana (F2-S3) antes de virarem ContractRule de produção.';

CREATE INDEX IF NOT EXISTS contract_rule_proposals_tenant_id_idx
  ON public.contract_rule_proposals (tenant_id);

CREATE INDEX IF NOT EXISTS contract_rule_proposals_operator_contract_id_idx
  ON public.contract_rule_proposals (operator_contract_id);

CREATE INDEX IF NOT EXISTS contract_rule_proposals_status_idx
  ON public.contract_rule_proposals (status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.contract_rule_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_rule_proposals_select_tenant ON public.contract_rule_proposals;
CREATE POLICY contract_rule_proposals_select_tenant
  ON public.contract_rule_proposals FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
  );

-- Só o agente de extração (service role) grava propostas; aprovação/edição
-- por humano (UPDATE) é escopo de F2-S3 — nenhuma policy de INSERT/UPDATE
-- para authenticated ainda, mesmo padrão restritivo de capture_pipeline_jobs.

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contract_rule_proposals_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contract_rule_proposals_updated_at ON public.contract_rule_proposals;
CREATE TRIGGER contract_rule_proposals_updated_at
  BEFORE UPDATE ON public.contract_rule_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.contract_rule_proposals_set_updated_at();
