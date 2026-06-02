-- MedFlow-IA: rollups leves de operational_events para analytics operacional.
-- Uma única round-trip; RLS via SECURITY INVOKER + current_tenant_ids().

CREATE OR REPLACE FUNCTION public.get_operational_analytics_event_rollups(
  p_from timestamptz,
  p_to timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH pair_assign AS (
    SELECT
      entity_id,
      MIN(created_at) FILTER (WHERE event_type = 'assignment_created') AS t_create,
      MIN(created_at) FILTER (WHERE event_type = 'assignment_confirmed') AS t_confirm
    FROM public.operational_events
    WHERE tenant_id IN (SELECT public.current_tenant_ids())
      AND entity_type = 'assignment'
      AND event_type IN ('assignment_created', 'assignment_confirmed')
      AND created_at >= p_from
      AND created_at < p_to
    GROUP BY entity_id
  ),
  pair_assign_ok AS (
    SELECT *
    FROM pair_assign
    WHERE t_create IS NOT NULL
      AND t_confirm IS NOT NULL
      AND t_confirm >= t_create
  ),
  pair_swap AS (
    SELECT
      entity_id,
      MIN(created_at) FILTER (WHERE event_type = 'swap_requested') AS t_req,
      MIN(created_at) FILTER (WHERE event_type = 'swap_approved') AS t_appr
    FROM public.operational_events
    WHERE tenant_id IN (SELECT public.current_tenant_ids())
      AND entity_type = 'swap'
      AND event_type IN ('swap_requested', 'swap_approved')
      AND created_at >= p_from
      AND created_at < p_to
    GROUP BY entity_id
  ),
  pair_swap_ok AS (
    SELECT *
    FROM pair_swap
    WHERE t_req IS NOT NULL
      AND t_appr IS NOT NULL
      AND t_appr >= t_req
  ),
  daily_ev AS (
    SELECT
      to_char(date_trunc('day', oe.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS bucket,
      oe.event_type,
      count(*)::bigint AS c
    FROM public.operational_events oe
    WHERE oe.tenant_id IN (SELECT public.current_tenant_ids())
      AND oe.created_at >= p_from
      AND oe.created_at < p_to
    GROUP BY 1, 2
  ),
  totals AS (
    SELECT oe.event_type, count(*)::bigint AS cnt
    FROM public.operational_events oe
    WHERE oe.tenant_id IN (SELECT public.current_tenant_ids())
      AND oe.created_at >= p_from
      AND oe.created_at < p_to
    GROUP BY oe.event_type
  ),
  avail AS (
    SELECT AVG(NULLIF(oe.metadata ->> 'window_count', '')::numeric) AS avg_windows
    FROM public.operational_events oe
    WHERE oe.tenant_id IN (SELECT public.current_tenant_ids())
      AND oe.event_type = 'availability_updated'
      AND oe.created_at >= p_from
      AND oe.created_at < p_to
      AND oe.metadata ? 'window_count'
  )
  SELECT jsonb_build_object(
    'daily_event_counts',
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object('bucket', d.bucket, 'event_type', d.event_type, 'c', d.c)
          ORDER BY d.bucket, d.event_type
        )
        FROM daily_ev d
      ),
      '[]'::jsonb
    ),
    'event_totals',
    COALESCE(
      (SELECT jsonb_object_agg(t.event_type, t.cnt) FROM totals t),
      '{}'::jsonb
    ),
    'assignment_confirmation',
    (
      SELECT jsonb_build_object(
        'avg_seconds',
        CASE
          WHEN COUNT(*) = 0 THEN NULL::numeric
          ELSE AVG(EXTRACT(EPOCH FROM (t_confirm - t_create)))
        END,
        'sample_size',
        COUNT(*)::bigint
      )
      FROM pair_assign_ok
    ),
    'swap_approval',
    (
      SELECT jsonb_build_object(
        'avg_seconds',
        CASE
          WHEN COUNT(*) = 0 THEN NULL::numeric
          ELSE AVG(EXTRACT(EPOCH FROM (t_appr - t_req)))
        END,
        'sample_size',
        COUNT(*)::bigint
      )
      FROM pair_swap_ok
    ),
    'availability_window_avg',
    (SELECT to_jsonb(a.avg_windows) FROM avail a)
  );
$$;

REVOKE ALL ON FUNCTION public.get_operational_analytics_event_rollups(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_operational_analytics_event_rollups(timestamptz, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.get_operational_analytics_event_rollups(timestamptz, timestamptz) IS
  'Agregações temporais e latências (assignment/swap) a partir de operational_events; invoker + RLS.';
