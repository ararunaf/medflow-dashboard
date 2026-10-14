-- Ponte captura → faturamento.
--
-- Uma guia capturada (OCR → parser → auditoria) e aprovada na mesa de
-- revisão pode virar uma guia TISS faturável (tiss_guides, status draft).
-- `capture_session_id` registra de qual captura a guia nasceu e o índice
-- único por tenant impede que a mesma captura gere duas guias, inclusive
-- com dois cliques simultâneos. Guias digitadas à mão continuam com NULL.

ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS capture_session_id uuid
    REFERENCES public.capture_sessions (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tiss_guides_tenant_capture_session_uidx
  ON public.tiss_guides (tenant_id, capture_session_id)
  WHERE capture_session_id IS NOT NULL;

COMMENT ON COLUMN public.tiss_guides.capture_session_id IS
  'Sessão de Captura Inteligente que originou a guia (NULL = digitada em Faturamento › Guias).';
