-- F1-S4: fila assíncrona real para o pipeline de Captura Inteligente.
--
-- Antes desta sprint, `uploadCaptureFileFn`/`retryCaptureUploadFn` executavam
-- OCR → Parser → Audit → Contract → Risk → Correction de forma síncrona
-- dentro da própria requisição HTTP de upload — sem retry real e sem
-- rastro de falha além do que já ficava em `capture_sessions.metadata`.
--
-- `capture_pipeline_jobs` é a fila: upload enfileira e retorna de imediato;
-- um worker externo (scripts/capture/worker/capture-pipeline-worker.ts)
-- reivindica jobs via `claim_capture_pipeline_job` (FOR UPDATE SKIP LOCKED,
-- seguro para múltiplos workers concorrentes), executa o pipeline existente
-- e decide sucesso/retry/dead-letter. Falha esgotada nunca é descartada:
-- fica em status 'dead_letter' e gera um `operational_events` crítico.

CREATE TABLE IF NOT EXISTS public.capture_pipeline_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  run_at timestamptz NOT NULL DEFAULT now(),
  locked_by text,
  locked_at timestamptz,
  last_error text,
  created_by uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capture_pipeline_jobs_session_fk
    FOREIGN KEY (tenant_id, session_id)
    REFERENCES public.capture_sessions (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT capture_pipeline_jobs_mode_chk CHECK (mode IN ('full', 'retry-upload')),
  CONSTRAINT capture_pipeline_jobs_status_chk CHECK (
    status IN ('queued', 'processing', 'succeeded', 'failed', 'dead_letter')
  ),
  CONSTRAINT capture_pipeline_jobs_attempts_chk CHECK (attempts >= 0),
  CONSTRAINT capture_pipeline_jobs_max_attempts_chk CHECK (max_attempts >= 1)
);

-- Índice parcial: só jobs elegíveis para claim entram na varredura do worker.
CREATE INDEX IF NOT EXISTS capture_pipeline_jobs_claim_idx
  ON public.capture_pipeline_jobs (run_at)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS capture_pipeline_jobs_tenant_session_idx
  ON public.capture_pipeline_jobs (tenant_id, session_id, created_at DESC);

DROP TRIGGER IF EXISTS capture_pipeline_jobs_updated_at ON public.capture_pipeline_jobs;
CREATE TRIGGER capture_pipeline_jobs_updated_at
  BEFORE UPDATE ON public.capture_pipeline_jobs
  FOR EACH ROW EXECUTE FUNCTION public.capture_set_updated_at();

ALTER TABLE public.capture_pipeline_jobs ENABLE ROW LEVEL SECURITY;

-- Enfileirar é uma ação de billing (mesmo grupo que já pode fazer upload).
CREATE POLICY capture_pipeline_jobs_select_tenant
  ON public.capture_pipeline_jobs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY capture_pipeline_jobs_insert_billing
  ON public.capture_pipeline_jobs FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.can_manage_billing()
    AND created_by = auth.uid()
  );

-- Claim/transição de estado é exclusivo do worker (service role, que já
-- ignora RLS) — nenhum client autenticado pode alterar um job diretamente.
CREATE POLICY capture_pipeline_jobs_update_service_only
  ON public.capture_pipeline_jobs FOR UPDATE TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- claim_capture_pipeline_job — reivindicação atômica segura para múltiplos
-- workers concorrentes (FOR UPDATE SKIP LOCKED). Só o service role executa.
--
-- Também reivindica jobs 'processing' travados há mais de 10 minutos (worker
-- morto/crash sem reportar desfecho) — garante que nenhum job fica perdido
-- indefinidamente em 'processing' quando o processo que o reivindicou morre.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_capture_pipeline_job(p_worker_id text)
RETURNS SETOF public.capture_pipeline_jobs
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  SELECT id INTO v_job_id
  FROM public.capture_pipeline_jobs
  WHERE (status = 'queued' AND run_at <= now())
     OR (status = 'processing' AND locked_at < now() - interval '10 minutes')
  ORDER BY run_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_job_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.capture_pipeline_jobs
  SET status = 'processing',
      locked_by = p_worker_id,
      locked_at = now(),
      attempts = attempts + 1
  WHERE id = v_job_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_capture_pipeline_job(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_capture_pipeline_job(text) TO service_role;

COMMENT ON TABLE public.capture_pipeline_jobs IS
  'Fila real do pipeline de Captura (F1-S4): upload enfileira, worker externo processa com retry/backoff e dead-letter alertado via operational_events.';
