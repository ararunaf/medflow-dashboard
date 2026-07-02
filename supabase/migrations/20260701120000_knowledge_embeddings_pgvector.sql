-- MedFlow-IA: infraestrutura RAG — pgvector, knowledge_embeddings, indexação
-- Sprint: AI-RAG-INFRASTRUCTURE-01
-- Sem integração Copilot — apenas armazenamento vetorial e busca interna.

-- ---------------------------------------------------------------------------
-- Extensão pgvector
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- Tabela principal — documentos vetoriais (chunks indexáveis)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE CASCADE,
  document_id text NOT NULL,
  domain text NOT NULL,
  classification text NOT NULL,
  agent_affinity text[] NOT NULL DEFAULT '{}',
  source_path text NOT NULL,
  chunk_index int NOT NULL DEFAULT 0,
  content text NOT NULL,
  content_hash text NOT NULL,
  embedding extensions.vector(1536),
  embedding_model text,
  metadata jsonb NOT NULL DEFAULT '{}',
  version text NOT NULL,
  language text NOT NULL DEFAULT 'pt-BR',
  indexed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.knowledge_embeddings IS
  'Chunks de conhecimento com embeddings para RAG. tenant_id NULL = corpus global.';

CREATE INDEX IF NOT EXISTS knowledge_embeddings_domain_idx
  ON public.knowledge_embeddings (domain);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_classification_idx
  ON public.knowledge_embeddings (classification);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_tenant_id_idx
  ON public.knowledge_embeddings (tenant_id);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_document_id_idx
  ON public.knowledge_embeddings (document_id);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_content_hash_idx
  ON public.knowledge_embeddings (content_hash);

CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_hnsw_idx
  ON public.knowledge_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ---------------------------------------------------------------------------
-- Registro de execuções de indexação
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knowledge_index_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('full', 'incremental')),
  source_path text NOT NULL,
  documents_processed int NOT NULL DEFAULT 0,
  chunks_processed int NOT NULL DEFAULT 0,
  chunks_embedded int NOT NULL DEFAULT 0,
  chunks_skipped int NOT NULL DEFAULT 0,
  embedding_model text NOT NULL,
  embedding_dimensions int NOT NULL DEFAULT 1536,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS knowledge_index_runs_started_at_idx
  ON public.knowledge_index_runs (started_at DESC);

-- ---------------------------------------------------------------------------
-- Busca vetorial (cosine similarity) — API interna
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_knowledge_embeddings(
  query_embedding extensions.vector(1536),
  match_count int DEFAULT 10,
  filter_domain text DEFAULT NULL,
  filter_classification text DEFAULT NULL,
  similarity_threshold float DEFAULT 0.0
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
    AND (
      ke.tenant_id IS NULL
      OR ke.tenant_id IN (SELECT public.current_tenant_ids())
    )
    AND (1 - (ke.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
$$;

REVOKE ALL ON FUNCTION public.match_knowledge_embeddings(
  extensions.vector, int, text, text, float
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_embeddings(
  extensions.vector, int, text, text, float
) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS — multi-tenant (leitura); escrita via service role na indexação
-- ---------------------------------------------------------------------------
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_index_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS knowledge_embeddings_select_tenant ON public.knowledge_embeddings;
CREATE POLICY knowledge_embeddings_select_tenant
  ON public.knowledge_embeddings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id IN (SELECT public.current_tenant_ids())
  );

DROP POLICY IF EXISTS knowledge_index_runs_select_tenant ON public.knowledge_index_runs;
CREATE POLICY knowledge_index_runs_select_tenant
  ON public.knowledge_index_runs
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NULL
    OR tenant_id IN (SELECT public.current_tenant_ids())
  );

-- Atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.knowledge_embeddings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_embeddings_updated_at ON public.knowledge_embeddings;
CREATE TRIGGER knowledge_embeddings_updated_at
  BEFORE UPDATE ON public.knowledge_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.knowledge_embeddings_set_updated_at();
