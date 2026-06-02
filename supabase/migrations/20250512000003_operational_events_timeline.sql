-- MedFlow-IA: timeline operacional + audit trail (operational_events)
-- Append-only por política de aplicação; RLS por tenant; realtime para UI viva.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operational_event_severity') THEN
    CREATE TYPE public.operational_event_severity AS ENUM ('info', 'warning', 'critical');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.operational_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  actor_profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  event_type text NOT NULL,
  severity public.operational_event_severity NOT NULL DEFAULT 'info',
  description text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operational_events_entity_type_chk CHECK (
    entity_type IN (
      'shift',
      'assignment',
      'swap',
      'availability',
      'schedule',
      'alert',
      'coordinator_action'
    )
  ),
  CONSTRAINT operational_events_event_type_chk CHECK (
    event_type IN (
      'shift_created',
      'shift_updated',
      'shift_cancelled',
      'assignment_created',
      'assignment_confirmed',
      'assignment_rejected',
      'swap_requested',
      'swap_approved',
      'swap_denied',
      'availability_updated',
      'critical_alert_generated',
      'operational_action_triggered'
    )
  )
);

CREATE INDEX IF NOT EXISTS operational_events_tenant_created_idx
  ON public.operational_events (tenant_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS operational_events_tenant_entity_idx
  ON public.operational_events (tenant_id, entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_events_tenant_professional_meta_idx
  ON public.operational_events (tenant_id, ((metadata ->> 'professional_id')))
  WHERE (metadata ? 'professional_id');

CREATE INDEX IF NOT EXISTS operational_events_tenant_shift_meta_idx
  ON public.operational_events (tenant_id, ((metadata ->> 'shift_id')))
  WHERE (metadata ? 'shift_id');

ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY operational_events_select_tenant
  ON public.operational_events
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY operational_events_insert_self_actor
  ON public.operational_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND actor_profile_id = auth.uid()
  );

COMMENT ON TABLE public.operational_events IS 'Audit trail append-only: eventos operacionais por tenant (timeline, rastreabilidade, base para IA futura).';

-- Realtime (Supabase hosted)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;
