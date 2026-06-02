-- MedFlow-IA V1: observabilidade operacional (logs, erros, métricas de saúde)
-- Append-only leve; RLS por tenant; sem PII sensível em stack (aplicação trunca).

CREATE TABLE IF NOT EXISTS public.operational_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  category text NOT NULL CHECK (char_length(category) <= 64),
  message text NOT NULL CHECK (char_length(message) <= 2048),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_logs_metadata_size_chk CHECK (pg_column_size(metadata) <= 12000)
);

CREATE INDEX IF NOT EXISTS operational_logs_tenant_created_idx
  ON public.operational_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_logs_tenant_category_idx
  ON public.operational_logs (tenant_id, category, created_at DESC);

ALTER TABLE public.operational_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY operational_logs_select_tenant
  ON public.operational_logs
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY operational_logs_insert_self_actor
  ON public.operational_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_logs IS 'Eventos operacionais informativos (export, heartbeat, fluxos) — volume controlado no app.';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.operational_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('operational', 'critical')),
  source text NOT NULL CHECK (
    source IN (
      'export',
      'reconciliation',
      'closing',
      'session',
      'upload',
      'client',
      'server',
      'supabase',
      'unknown'
    )
  ),
  error_code text,
  message text NOT NULL CHECK (char_length(message) <= 2048),
  detail text,
  stack_snippet text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_errors_metadata_size_chk CHECK (pg_column_size(metadata) <= 12000),
  CONSTRAINT operational_errors_stack_size_chk CHECK (stack_snippet IS NULL OR char_length(stack_snippet) <= 4000)
);

CREATE INDEX IF NOT EXISTS operational_errors_tenant_created_idx
  ON public.operational_errors (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_errors_tenant_source_idx
  ON public.operational_errors (tenant_id, source, created_at DESC);

ALTER TABLE public.operational_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY operational_errors_select_tenant
  ON public.operational_errors
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY operational_errors_insert_self_actor
  ON public.operational_errors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_errors IS 'Falhas operacionais registradas (conciliação, fechamento, sessão, upload, etc.).';

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.operational_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  metric_name text NOT NULL CHECK (char_length(metric_name) <= 128),
  metric_value double precision,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_health_metrics_details_size_chk CHECK (pg_column_size(details) <= 8000)
);

CREATE INDEX IF NOT EXISTS operational_health_metrics_tenant_recorded_idx
  ON public.operational_health_metrics (tenant_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS operational_health_metrics_tenant_name_idx
  ON public.operational_health_metrics (tenant_id, metric_name, recorded_at DESC);

ALTER TABLE public.operational_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY operational_health_metrics_select_tenant
  ON public.operational_health_metrics
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY operational_health_metrics_insert_self_actor
  ON public.operational_health_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_health_metrics IS 'Snapshots de saúde (latência Supabase, heartbeat, contadores leves).';
