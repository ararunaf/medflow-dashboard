-- Auditoria de seguranca: auth, tentativas de login, sessao, SSR e acesso por tenant.
-- Sem PII em texto claro (email/IP apenas como hash). Insercao via service role no app.

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_category text NOT NULL CHECK (
    event_category IN ('auth', 'login_attempt', 'session', 'ssr', 'tenant_access')
  ),
  event_type text NOT NULL CHECK (char_length(event_type) <= 64),
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked', 'error')),
  tenant_id uuid REFERENCES public.tenants (id) ON DELETE SET NULL,
  profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  email_hash text,
  ip_hash text,
  message text CHECK (message IS NULL OR char_length(message) <= 512),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_audit_logs_metadata_size_chk CHECK (pg_column_size(metadata) <= 8000)
);

CREATE INDEX IF NOT EXISTS security_audit_logs_created_idx
  ON public.security_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_logs_tenant_created_idx
  ON public.security_audit_logs (tenant_id, created_at DESC)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS security_audit_logs_category_created_idx
  ON public.security_audit_logs (event_category, created_at DESC);

ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Leitura: admins do tenant; super_admin ve registros sem tenant (pre-login global).
CREATE POLICY security_audit_logs_select_tenant_admin
  ON public.security_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (
      tenant_id IS NOT NULL
      AND tenant_id IN (SELECT public.current_tenant_ids())
      AND public.is_tenant_admin()
    )
    OR (
      tenant_id IS NULL
      AND public.current_user_role() = 'super_admin'
    )
  );

COMMENT ON TABLE public.security_audit_logs IS
  'Trilha de seguranca (login, sessao, SSR, tenant) — append-only; insercao pelo servidor com service role.';
