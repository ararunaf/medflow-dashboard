-- MedFlow-IA V1 comercial: tenant_settings, branding (storage), tenant demo leve.
-- Não inclui ERP fiscal, bancos ou IA financeira.

-- ---------------------------------------------------------------------------
-- tenant_settings (1:1 com tenants)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants (id) ON DELETE CASCADE,
  institution_name text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#1e3a5f',
  secondary_color text NOT NULL DEFAULT '#0d9488',
  logo_url text,
  favicon_url text,
  banner_url text,
  contact_email text NOT NULL DEFAULT '',
  support_phone text NOT NULL DEFAULT '',
  operational_timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  currency text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_settings_institution_name_idx
  ON public.tenant_settings (lower(institution_name));

ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_settings_select_tenant
  ON public.tenant_settings
  FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY tenant_settings_admin_write
  ON public.tenant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

CREATE POLICY tenant_settings_admin_update
  ON public.tenant_settings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

COMMENT ON TABLE public.tenant_settings IS
  'Parametrização institucional e branding por tenant (V1 demonstração / implantação).';

CREATE OR REPLACE FUNCTION public.tenant_settings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.tenant_settings_set_updated_at();

-- Backfill a partir de tenants existentes
INSERT INTO public.tenant_settings (
  tenant_id,
  institution_name,
  primary_color,
  secondary_color,
  contact_email
)
SELECT
  t.id,
  COALESCE(NULLIF(trim(t.name), ''), 'Instituição'),
  '#1e3a5f',
  '#0d9488',
  ''
FROM public.tenants t
ON CONFLICT (tenant_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage público: logomarca / banner / favicon (paths {tenant_id}/...)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS tenant_branding_objects_select_public ON storage.objects;
DROP POLICY IF EXISTS tenant_branding_objects_insert_admin ON storage.objects;
DROP POLICY IF EXISTS tenant_branding_objects_update_admin ON storage.objects;
DROP POLICY IF EXISTS tenant_branding_objects_delete_admin ON storage.objects;

CREATE POLICY tenant_branding_objects_select_public
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'tenant-branding');

CREATE POLICY tenant_branding_objects_insert_admin
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tenant-branding'
    AND public.is_tenant_admin()
    AND (storage.foldername(name))[1] = (
      SELECT p.tenant_id::text FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY tenant_branding_objects_update_admin
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'tenant-branding'
    AND public.is_tenant_admin()
    AND (storage.foldername(name))[1] = (
      SELECT p.tenant_id::text FROM public.profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'tenant-branding'
    AND public.is_tenant_admin()
    AND (storage.foldername(name))[1] = (
      SELECT p.tenant_id::text FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY tenant_branding_objects_delete_admin
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tenant-branding'
    AND public.is_tenant_admin()
    AND (storage.foldername(name))[1] = (
      SELECT p.tenant_id::text FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Tenant catálogo demo (convênios) — sem guias/repasses (exige profissionais)
-- ---------------------------------------------------------------------------
INSERT INTO public.tenants (name, slug)
VALUES ('MedicFlow-AI V1 Demo', 'medflow-v1-demo')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tenant_settings (
  tenant_id,
  institution_name,
  primary_color,
  secondary_color,
  contact_email,
  support_phone
)
SELECT
  t.id,
  'MedicFlow-AI — Ambiente demonstração',
  '#0f172a',
  '#14b8a6',
  'demo@medicflow.local',
  '+55 11 4000-0000'
FROM public.tenants t
WHERE t.slug = 'medflow-v1-demo'
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO public.insurance_providers (tenant_id, name, ans_code, active)
SELECT t.id, 'Convênio Demo Alfa', '999999', true
FROM public.tenants t
WHERE t.slug = 'medflow-v1-demo'
  AND NOT EXISTS (
    SELECT 1 FROM public.insurance_providers ip
    WHERE ip.tenant_id = t.id AND ip.name = 'Convênio Demo Alfa'
  );

INSERT INTO public.insurance_providers (tenant_id, name, ans_code, active)
SELECT t.id, 'Convênio Demo Beta', '888888', true
FROM public.tenants t
WHERE t.slug = 'medflow-v1-demo'
  AND NOT EXISTS (
    SELECT 1 FROM public.insurance_providers ip
    WHERE ip.tenant_id = t.id AND ip.name = 'Convênio Demo Beta'
  );

INSERT INTO public.insurance_contracts (
  tenant_id,
  insurance_provider_id,
  name,
  contract_number,
  active
)
SELECT
  t.id,
  ip.id,
  'Contrato demonstração 2026',
  'DEMO-2026-001',
  true
FROM public.tenants t
JOIN public.insurance_providers ip ON ip.tenant_id = t.id AND ip.name = 'Convênio Demo Alfa'
WHERE t.slug = 'medflow-v1-demo'
  AND NOT EXISTS (
    SELECT 1
    FROM public.insurance_contracts c
    WHERE c.tenant_id = t.id AND c.contract_number = 'DEMO-2026-001'
  );
