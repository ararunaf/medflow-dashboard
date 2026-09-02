-- TISS-02-DATA — Catálogo real de códigos TUSS e CID-10 (substitui o seed mínimo de 12 códigos).
-- Não altera Ports, Runtime, Gateways nem Foundations 4–7.
-- Tabelas exclusivas da fonte de dados do TISSCatalogStore (hidratação server-only).
--
-- CBHPM fica fora deste escopo por ora: é tabela proprietária da AMB, não pública
-- como TUSS/CID-10 — precisa de fonte licenciada definida pela cooperativa antes de ingerir.

CREATE TABLE IF NOT EXISTS public.tiss_tuss_procedures (
  tuss_code text PRIMARY KEY,
  name text NOT NULL,
  group_code text NULL,
  category text NULL,
  requires_authorization boolean NOT NULL DEFAULT false,
  ans_edition text NULL,
  effective_from date NULL,
  effective_to date NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'ans-tuss',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tiss_tuss_procedures_status_idx
  ON public.tiss_tuss_procedures (status);

CREATE TABLE IF NOT EXISTS public.tiss_cid10_codes (
  cid_code text PRIMARY KEY,
  description text NOT NULL,
  chapter text NULL,
  effective_from date NULL,
  effective_to date NULL,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'datasus-cid10',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tiss_cid10_codes_status_idx
  ON public.tiss_cid10_codes (status);

ALTER TABLE public.tiss_tuss_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiss_cid10_codes ENABLE ROW LEVEL SECURITY;

-- Service role / backend server-side; sem policies de anon/authenticated
-- (escrita exclusiva via script de ingestão scripts/enterprise/tiss-catalog/,
--  leitura exclusiva via TISSCatalogStore → bindServerTissCatalogStore()).
