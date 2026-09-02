-- MedFlow-IA: ingestão de contrato de operadora para RAG (F2-S1)
-- Sprint: F2-S1 — Ingestão de contrato e pipeline RAG
-- Metadado do upload de contrato PDF por operadora; os chunks extraídos do
-- PDF e seus embeddings são gravados em public.knowledge_embeddings
-- (domain = 'contract', document_id = operator_contracts.id::text),
-- reaproveitando a infraestrutura pgvector já existente desde
-- 20260701120000_knowledge_embeddings_pgvector.sql.

CREATE TABLE IF NOT EXISTS public.operator_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  operator_code text NOT NULL,
  operator_name text,
  contract_label text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  byte_length integer NOT NULL,
  checksum_sha256 text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'clinical-documents',
  storage_path text NOT NULL,
  page_count integer,
  status text NOT NULL DEFAULT 'uploaded',
  chunk_count integer NOT NULL DEFAULT 0,
  embedding_model text,
  error_message text,
  indexed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_contracts_byte_length_chk CHECK (byte_length > 0),
  CONSTRAINT operator_contracts_checksum_chk CHECK (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT operator_contracts_storage_bucket_chk CHECK (storage_bucket = 'clinical-documents'),
  CONSTRAINT operator_contracts_status_chk CHECK (
    status IN ('uploaded', 'indexing', 'indexed', 'failed')
  )
);

COMMENT ON TABLE public.operator_contracts IS
  'Contrato PDF de operadora enviado para ingestão RAG (F2-S1). Chunks/embeddings ficam em knowledge_embeddings (domain=''contract'', document_id=operator_contracts.id).';

CREATE INDEX IF NOT EXISTS operator_contracts_tenant_id_idx
  ON public.operator_contracts (tenant_id);

CREATE INDEX IF NOT EXISTS operator_contracts_operator_code_idx
  ON public.operator_contracts (operator_code);

CREATE INDEX IF NOT EXISTS operator_contracts_status_idx
  ON public.operator_contracts (status);

-- Dedupe de reenvio é responsabilidade da aplicação (consulta por
-- tenant_id + checksum_sha256 antes de inserir) — mesmo padrão de
-- capture_documents, sem constraint única no banco.
CREATE INDEX IF NOT EXISTS operator_contracts_checksum_idx
  ON public.operator_contracts (tenant_id, checksum_sha256);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.operator_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operator_contracts_select_tenant ON public.operator_contracts;
CREATE POLICY operator_contracts_select_tenant
  ON public.operator_contracts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

DROP POLICY IF EXISTS operator_contracts_insert_billing ON public.operator_contracts;
CREATE POLICY operator_contracts_insert_billing
  ON public.operator_contracts FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

-- Só o worker de indexação (service role) transiciona status/chunk_count/
-- embedding_model/indexed_at — mesmo padrão de capture_pipeline_jobs (F1-S4).
DROP POLICY IF EXISTS operator_contracts_update_service_only ON public.operator_contracts;
CREATE POLICY operator_contracts_update_service_only
  ON public.operator_contracts FOR UPDATE TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.operator_contracts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS operator_contracts_updated_at ON public.operator_contracts;
CREATE TRIGGER operator_contracts_updated_at
  BEFORE UPDATE ON public.operator_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.operator_contracts_set_updated_at();
