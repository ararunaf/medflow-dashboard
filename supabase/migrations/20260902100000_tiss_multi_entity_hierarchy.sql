-- MedFlow-IA: hierarquia multi-entidade (cooperativa -> clinica afiliada -> profissional)
-- F1-S2: enriquece hospitals (clinica/instituicao conveniada), cria vinculo
-- profissional <-> hospital N:N, e liga tiss_guides a hospital_id para permitir
-- relatorio por instituicao de origem e central de vagas multi-fonte (Fase 4).
--
-- Nao introduz um segundo nivel de tenant: a cooperativa segue sendo o tenant
-- (public.tenants), e hospitals ja e' o registro tenant-scoped da entidade
-- conveniada. O que faltava era (a) hospitals ter campos institucionais reais,
-- (b) profissional poder estar afiliado a N hospitals, (c) a guia TISS saber
-- de qual hospital ela se originou.

-- ---------------------------------------------------------------------------
-- Hospitals: enriquecer com dados institucionais reais
-- ---------------------------------------------------------------------------
ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS hospitals_tenant_id_id_uidx
  ON public.hospitals (tenant_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS hospitals_tenant_cnpj_uidx
  ON public.hospitals (tenant_id, cnpj)
  WHERE cnpj IS NOT NULL AND cnpj <> '';

CREATE OR REPLACE FUNCTION public.hospitals_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hospitals_set_updated_at_trg ON public.hospitals;
CREATE TRIGGER hospitals_set_updated_at_trg
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW EXECUTE FUNCTION public.hospitals_set_updated_at();

-- ---------------------------------------------------------------------------
-- Afiliacao profissional <-> hospital (N:N) -- um cooperado pode atender
-- em varias clinicas/hospitais conveniados da mesma cooperativa.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  professional_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT professional_hospitals_tenant_professional_fk
    FOREIGN KEY (tenant_id, professional_id)
    REFERENCES public.professionals (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT professional_hospitals_tenant_hospital_fk
    FOREIGN KEY (tenant_id, hospital_id)
    REFERENCES public.hospitals (tenant_id, id)
    ON DELETE CASCADE,
  UNIQUE (tenant_id, professional_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS professional_hospitals_tenant_hospital_idx
  ON public.professional_hospitals (tenant_id, hospital_id);
CREATE INDEX IF NOT EXISTS professional_hospitals_tenant_professional_idx
  ON public.professional_hospitals (tenant_id, professional_id);

-- ---------------------------------------------------------------------------
-- tiss_guides: saber de qual hospital/clinica conveniada a guia se originou.
-- Nullable + backfill best-effort: guias existentes nao tem essa informacao
-- ainda: preenchimento retroativo fica para quando o formulario de lancamento
-- (src/routes/tiss.tsx) passar a coletar o campo -- fora do escopo desta
-- migracao, que so prepara a coluna e a integridade referencial.
-- ---------------------------------------------------------------------------
ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS hospital_id uuid;

ALTER TABLE public.tiss_guides
  DROP CONSTRAINT IF EXISTS tiss_guides_tenant_hospital_fk;

ALTER TABLE public.tiss_guides
  ADD CONSTRAINT tiss_guides_tenant_hospital_fk
  FOREIGN KEY (tenant_id, hospital_id)
  REFERENCES public.hospitals (tenant_id, id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tiss_guides_tenant_hospital_idx
  ON public.tiss_guides (tenant_id, hospital_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.professional_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY professional_hospitals_select_tenant
  ON public.professional_hospitals FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY professional_hospitals_write_manager
  ON public.professional_hospitals FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.is_operational_manager())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.is_operational_manager());
