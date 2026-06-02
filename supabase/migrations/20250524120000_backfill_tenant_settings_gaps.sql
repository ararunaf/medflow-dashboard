-- Backfill tenant_settings para tenants sem registro (ex.: medflow-admin após migration de branding).

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
LEFT JOIN public.tenant_settings ts ON ts.tenant_id = t.id
WHERE ts.tenant_id IS NULL;
