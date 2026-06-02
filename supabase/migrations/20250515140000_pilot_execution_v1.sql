-- MedFlow-IA V1: execução piloto — feedback, incidentes, sugestões, flags e adoção leve
-- Append-only onde possível; RLS por tenant; volume controlado no app.

-- ---------------------------------------------------------------------------
-- Feedback operacional geral
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pilot_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(category) <= 64),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description text NOT NULL CHECK (char_length(description) <= 4096),
  context_route text,
  context_module text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pilot_feedback_metadata_size_chk CHECK (pg_column_size(metadata) <= 8000)
);

CREATE INDEX IF NOT EXISTS pilot_feedback_tenant_created_idx
  ON public.pilot_feedback (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_feedback_tenant_category_idx
  ON public.pilot_feedback (tenant_id, category, created_at DESC);

ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_feedback_select_tenant
  ON public.pilot_feedback
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY pilot_feedback_insert_self_actor
  ON public.pilot_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.pilot_feedback IS 'Feedback operacional do piloto V1 — captura contextual leve.';

-- ---------------------------------------------------------------------------
-- Incidentes operacionais (tracking com resolução)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pilot_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(category) <= 64),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL CHECK (char_length(description) <= 4096),
  incident_status text NOT NULL DEFAULT 'open' CHECK (
    incident_status IN ('open', 'investigating', 'resolved', 'closed')
  ),
  operational_source text NOT NULL DEFAULT 'unknown' CHECK (char_length(operational_source) <= 64),
  resolution_notes text CHECK (resolution_notes IS NULL OR char_length(resolution_notes) <= 4096),
  follow_up_status text NOT NULL DEFAULT 'pending' CHECK (
    follow_up_status IN ('pending', 'scheduled', 'done', 'not_required')
  ),
  context_route text,
  context_module text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT pilot_incidents_metadata_size_chk CHECK (pg_column_size(metadata) <= 8000)
);

CREATE INDEX IF NOT EXISTS pilot_incidents_tenant_created_idx
  ON public.pilot_incidents (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_incidents_tenant_status_idx
  ON public.pilot_incidents (tenant_id, incident_status, created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_incidents_tenant_severity_idx
  ON public.pilot_incidents (tenant_id, severity, created_at DESC);

ALTER TABLE public.pilot_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_incidents_select_tenant
  ON public.pilot_incidents
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY pilot_incidents_insert_self_actor
  ON public.pilot_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

CREATE POLICY pilot_incidents_update_tenant_admin
  ON public.pilot_incidents
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  )
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()));

COMMENT ON TABLE public.pilot_incidents IS 'Incidentes operacionais do piloto com status e resolução.';

-- ---------------------------------------------------------------------------
-- Sugestões de melhoria
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pilot_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category text NOT NULL CHECK (char_length(category) <= 64),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  description text NOT NULL CHECK (char_length(description) <= 4096),
  suggestion_status text NOT NULL DEFAULT 'submitted' CHECK (
    suggestion_status IN ('submitted', 'reviewed', 'planned', 'done', 'declined')
  ),
  context_route text,
  context_module text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pilot_suggestions_metadata_size_chk CHECK (pg_column_size(metadata) <= 8000)
);

CREATE INDEX IF NOT EXISTS pilot_suggestions_tenant_created_idx
  ON public.pilot_suggestions (tenant_id, created_at DESC);

ALTER TABLE public.pilot_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_suggestions_select_tenant
  ON public.pilot_suggestions
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY pilot_suggestions_insert_self_actor
  ON public.pilot_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.pilot_suggestions IS 'Sugestões de melhoria do piloto V1.';

-- ---------------------------------------------------------------------------
-- Feature flags leves por tenant
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pilot_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  flag_key text NOT NULL CHECK (char_length(flag_key) <= 128),
  enabled boolean NOT NULL DEFAULT false,
  description text CHECK (description IS NULL OR char_length(description) <= 512),
  updated_by_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pilot_feature_flags_tenant_key_uniq UNIQUE (tenant_id, flag_key)
);

CREATE INDEX IF NOT EXISTS pilot_feature_flags_tenant_idx
  ON public.pilot_feature_flags (tenant_id, flag_key);

ALTER TABLE public.pilot_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_feature_flags_select_tenant
  ON public.pilot_feature_flags
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY pilot_feature_flags_write_admin
  ON public.pilot_feature_flags
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

COMMENT ON TABLE public.pilot_feature_flags IS 'Flags leves de rollout piloto por tenant.';

-- ---------------------------------------------------------------------------
-- Eventos de adoção operacional (telemetria leve)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pilot_adoption_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (
    event_type IN (
      'login',
      'onboarding_complete',
      'dashboard_view',
      'financial_workflow',
      'module_access',
      'feature_use'
    )
  ),
  module text NOT NULL CHECK (char_length(module) <= 64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pilot_adoption_events_metadata_size_chk CHECK (pg_column_size(metadata) <= 4000)
);

CREATE INDEX IF NOT EXISTS pilot_adoption_events_tenant_created_idx
  ON public.pilot_adoption_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_adoption_events_tenant_module_idx
  ON public.pilot_adoption_events (tenant_id, module, created_at DESC);

CREATE INDEX IF NOT EXISTS pilot_adoption_events_tenant_type_idx
  ON public.pilot_adoption_events (tenant_id, event_type, created_at DESC);

ALTER TABLE public.pilot_adoption_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_adoption_events_select_tenant
  ON public.pilot_adoption_events
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY pilot_adoption_events_insert_self_actor
  ON public.pilot_adoption_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.pilot_adoption_events IS 'Eventos leves de adoção piloto — sem PII extra.';
