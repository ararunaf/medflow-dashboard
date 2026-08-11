-- OPER-INF-Q — Backend persistente do QueueRuntimePort (Supabase/Postgres).
-- Não altera Ports, Runtime, Gateways nem Foundations 4–7.
-- Tabelas exclusivas do adapter Queue Runtime.

CREATE TABLE IF NOT EXISTS public.enterprise_queue_runtime_queues (
  queue_id text PRIMARY KEY,
  queue_name text NOT NULL,
  message_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count integer NOT NULL DEFAULT 0,
  identity jsonb NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS enterprise_queue_runtime_queues_name_uidx
  ON public.enterprise_queue_runtime_queues (queue_name);

CREATE TABLE IF NOT EXISTS public.enterprise_queue_runtime_messages (
  message_id text PRIMARY KEY,
  queue_id text NOT NULL REFERENCES public.enterprise_queue_runtime_queues (queue_id) ON DELETE CASCADE,
  status text NOT NULL,
  payload_ref text NULL,
  identity jsonb NULL,
  metadata jsonb NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enterprise_queue_runtime_messages_queue_status_idx
  ON public.enterprise_queue_runtime_messages (queue_id, status);

ALTER TABLE public.enterprise_queue_runtime_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_queue_runtime_messages ENABLE ROW LEVEL SECURITY;

-- Service role / backend server-side; sem policies de anon/authenticated
-- (escrita exclusiva via QueueRuntimePort → adapter → backend).
