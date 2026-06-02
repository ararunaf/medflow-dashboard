-- MedFlow-IA: feedback humano sobre recomendações operacionais + rollups leves
-- (effectiveness, tendências, sinais para IA futura — sem ML/RL na aplicação).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_recommendation_feedback_type') THEN
    CREATE TYPE public.operational_recommendation_feedback_type AS ENUM (
      'accepted',
      'dismissed',
      'ignored',
      'executed',
      'execution_failed'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  feedback_type public.operational_recommendation_feedback_type NOT NULL,
  effectiveness_score numeric(4, 3),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_recommendation_feedback_score_chk CHECK (
    effectiveness_score IS NULL OR (effectiveness_score >= 0 AND effectiveness_score <= 1)
  ),
  CONSTRAINT operational_recommendation_feedback_rec_id_chk CHECK (
    recommendation_id ~ '^rec:[^:]+:.+'
  )
);

CREATE INDEX IF NOT EXISTS operational_recommendation_feedback_tenant_created_idx
  ON public.operational_recommendation_feedback (tenant_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS operational_recommendation_feedback_tenant_rec_idx
  ON public.operational_recommendation_feedback (tenant_id, recommendation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_recommendation_feedback_tenant_actor_idx
  ON public.operational_recommendation_feedback (tenant_id, actor_profile_id, created_at DESC);

ALTER TABLE public.operational_recommendation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY operational_recommendation_feedback_select_tenant
  ON public.operational_recommendation_feedback
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY operational_recommendation_feedback_insert_self_actor
  ON public.operational_recommendation_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_recommendation_feedback IS
  'Feedback operacional humano-in-the-loop sobre recomendações determinísticas; base para effectiveness e aprendizado futuro.';

-- ---------------------------------------------------------------------------
-- Rollups agregados (uma round-trip; sem varrer histórico completo no app)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_operational_recommendation_feedback_rollups(
  p_from timestamptz,
  p_to timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT *
    FROM public.operational_recommendation_feedback f
    WHERE f.tenant_id IN (SELECT public.current_tenant_ids())
      AND f.created_at >= p_from
      AND f.created_at < p_to
  ),
  by_type AS (
    SELECT f.feedback_type, count(*)::bigint AS c
    FROM scoped f
    GROUP BY f.feedback_type
  ),
  daily AS (
    SELECT
      to_char(date_trunc('day', f.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS bucket,
      f.feedback_type,
      count(*)::bigint AS c
    FROM scoped f
    GROUP BY 1, 2
  ),
  by_actor AS (
    SELECT f.actor_profile_id, f.feedback_type, count(*)::bigint AS c
    FROM scoped f
    GROUP BY 1, 2
  ),
  by_trigger AS (
    SELECT
      COALESCE((regexp_match(f.recommendation_id, '^rec:[^:]+:(.+)$'))[1], 'unknown') AS trigger_key,
      f.feedback_type,
      count(*)::bigint AS c
    FROM scoped f
    GROUP BY 1, 2
  ),
  totals AS (
    SELECT count(*)::bigint AS n FROM scoped
  ),
  mitigation AS (
    SELECT
      count(*) FILTER (
        WHERE f.feedback_type = 'executed'
          AND f.effectiveness_score IS NOT NULL
          AND f.effectiveness_score >= 0.7
      )::bigint AS ok,
      count(*) FILTER (
        WHERE f.feedback_type = 'executed'
          AND f.effectiveness_score IS NOT NULL
      )::bigint AS scored
    FROM scoped f
  )
  SELECT jsonb_build_object(
    'sampleSize', (SELECT n FROM totals),
    'countsByFeedbackType',
    COALESCE((SELECT jsonb_object_agg(b.feedback_type::text, b.c) FROM by_type b), '{}'::jsonb),
    'dailyByType',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('bucket', d.bucket, 'feedback_type', d.feedback_type::text, 'c', d.c)
          ORDER BY d.bucket, d.feedback_type
        )
        FROM daily d
      ),
      '[]'::jsonb
    ),
    'byActorType',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'actor_profile_id', a.actor_profile_id::text,
            'feedback_type', a.feedback_type::text,
            'c', a.c
          )
          ORDER BY a.actor_profile_id::text, a.feedback_type
        )
        FROM by_actor a
      ),
      '[]'::jsonb
    ),
    'byTriggerType',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'trigger_key', t.trigger_key,
            'feedback_type', t.feedback_type::text,
            'c', t.c
          )
          ORDER BY t.trigger_key, t.feedback_type
        )
        FROM by_trigger t
      ),
      '[]'::jsonb
    ),
    'mitigationScoredSuccess', (SELECT ok FROM mitigation),
    'mitigationScoredTotal', (SELECT scored FROM mitigation)
  );
$$;

REVOKE ALL ON FUNCTION public.get_operational_recommendation_feedback_rollups(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_operational_recommendation_feedback_rollups(timestamptz, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.get_operational_recommendation_feedback_rollups(timestamptz, timestamptz) IS
  'Agregações de feedback de recomendações no intervalo; invoker + RLS por tenant.';

-- ---------------------------------------------------------------------------
-- Último feedback por recommendation_id (lista curta do snapshot atual)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_latest_operational_recommendation_feedback_for_ids(p_ids text[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'recommendation_id', x.recommendation_id,
          'feedback_type', x.feedback_type::text,
          'effectiveness_score', x.effectiveness_score,
          'created_at', x.created_at
        )
        ORDER BY x.recommendation_id
      )
      FROM (
        SELECT DISTINCT ON (f.recommendation_id)
          f.recommendation_id,
          f.feedback_type,
          f.effectiveness_score,
          f.created_at
        FROM public.operational_recommendation_feedback f
        WHERE f.tenant_id IN (SELECT public.current_tenant_ids())
          AND f.recommendation_id = ANY(p_ids)
        ORDER BY f.recommendation_id, f.created_at DESC
      ) x
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_latest_operational_recommendation_feedback_for_ids(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_operational_recommendation_feedback_for_ids(text[]) TO authenticated;

COMMENT ON FUNCTION public.get_latest_operational_recommendation_feedback_for_ids(text[]) IS
  'Último registro de feedback por recommendation_id (DISTINCT ON); invoker + RLS.';

-- Realtime (Supabase hosted)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_recommendation_feedback;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
