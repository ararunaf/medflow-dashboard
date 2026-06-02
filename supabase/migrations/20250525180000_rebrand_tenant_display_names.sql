-- Rebrand visual: nomes de tenant e instituição exibidos na UI (MedicFlow-AI).
-- Slugs internos (medflow-admin, medflow-v1-demo) permanecem por compatibilidade.

UPDATE public.tenants
SET name = 'MedicFlow-AI V1 Demo'
WHERE slug = 'medflow-v1-demo';

UPDATE public.tenant_settings ts
SET
  institution_name = 'MedicFlow-AI — Ambiente demonstração',
  contact_email = CASE
    WHEN ts.contact_email = 'demo@medflow.local' THEN 'demo@medicflow.local'
    ELSE ts.contact_email
  END
FROM public.tenants t
WHERE t.slug = 'medflow-v1-demo'
  AND ts.tenant_id = t.id;

UPDATE public.tenants
SET name = 'MedicFlow-AI Administração'
WHERE slug = 'medflow-admin';

UPDATE public.tenant_settings ts
SET institution_name = 'MedicFlow-AI Administração'
FROM public.tenants t
WHERE t.slug = 'medflow-admin'
  AND ts.tenant_id = t.id;
