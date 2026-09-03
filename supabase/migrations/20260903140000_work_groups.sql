-- F5-S1: grupos de trabalho — agrupamento administrativo de profissionais
-- para relatório de produção/repasse, distinto de `specialty` (atributo
-- clínico individual). N:1 (um profissional pertence a no máximo um
-- grupo, nullable — atribuir não é obrigatório).
CREATE TABLE IF NOT EXISTS public.work_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS work_groups_tenant_id_id_uidx ON public.work_groups (tenant_id, id);
CREATE INDEX IF NOT EXISTS work_groups_tenant_id_idx ON public.work_groups (tenant_id);

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS work_group_id uuid;

-- `ON DELETE SET NULL (work_group_id)` — lista de colunas explícita.
-- Sem ela, Postgres zera TODAS as colunas da FK composta no DELETE,
-- incluindo tenant_id (NOT NULL em professionals), e a operação inteira
-- falha (ver 20260903150000_fix_work_group_fk_set_null.sql para o achado
-- real que motivou isso).
ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_tenant_work_group_fk;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_tenant_work_group_fk
  FOREIGN KEY (tenant_id, work_group_id)
  REFERENCES public.work_groups (tenant_id, id)
  ON DELETE SET NULL (work_group_id);

CREATE INDEX IF NOT EXISTS professionals_work_group_id_idx
  ON public.professionals (tenant_id, work_group_id);

-- RLS: leitura para qualquer membro do tenant; escrita só para gestor
-- (mesmo padrão de professional_hospitals, F4-S2 — ao contrário da
-- policy antiga e permissiva demais de `hospitals`/`professionals`
-- em si, que é FOR ALL para qualquer membro e é uma lacuna já
-- rastreada no roadmap, não replicada aqui).
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_groups_select_tenant
  ON public.work_groups FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY work_groups_write_manager
  ON public.work_groups FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()) AND public.is_operational_manager())
  WITH CHECK (tenant_id IN (SELECT public.current_tenant_ids()) AND public.is_operational_manager());
