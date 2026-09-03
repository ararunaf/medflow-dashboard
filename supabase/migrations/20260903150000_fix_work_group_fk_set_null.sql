-- Corrige um bug real encontrado ao testar contra staging real (não
-- suposição): `ON DELETE SET NULL` numa FK COMPOSTA, sem lista de colunas,
-- zera TODAS as colunas da FK — incluindo `tenant_id`, que é NOT NULL em
-- `professionals`. Resultado: apagar um work_group com qualquer
-- profissional atribuído falhava com "null value in column tenant_id
-- violates not-null constraint" (a linha nunca chegava a ficar corrompida
-- — o DELETE inteiro era rejeitado — mas a feature "apagar grupo" ficava
-- inutilizável).
--
-- Postgres 15+ suporta `ON DELETE SET NULL (lista de colunas)` para
-- restringir quais colunas são zeradas — usamos isso para zerar só
-- `work_group_id`, nunca `tenant_id`.
ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_tenant_work_group_fk;
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_tenant_work_group_fk
  FOREIGN KEY (tenant_id, work_group_id)
  REFERENCES public.work_groups (tenant_id, id)
  ON DELETE SET NULL (work_group_id);

-- NOTA (não corrigido aqui, fora de escopo desta sprint): o mesmo padrão
-- (`ON DELETE SET NULL` composto sem lista de colunas) já existe em
-- `tiss_guides_tenant_hospital_fk` (20260902100000_tiss_multi_entity_hierarchy.sql)
-- e muito provavelmente tem o MESMO bug — apagar um hospital com guias
-- vinculadas deve falhar hoje com o mesmo erro. Registrado no roadmap para
-- correção futura; não foi possível confirmar aqui sem um teste dedicado
-- de ciclo de vida de hospital.
