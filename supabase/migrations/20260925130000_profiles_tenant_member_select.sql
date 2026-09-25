-- Membros do tenant passam a enxergar os perfis (nome/papel) dos colegas.
--
-- Até aqui `profiles` só tinha `profiles_self_select` (id = auth.uid()).
-- Toda tela que mostra outro usuário faz join em profiles — plantonista
-- confirmado nas escalas, colegas elegíveis para troca, profissional nas
-- guias/repasses, revisor de regra contratual — e recebia `profile: null`,
-- exibindo os registros sem nome para qualquer usuário do tenant.
--
-- A política não pode usar current_tenant_ids() (SECURITY INVOKER, lê a
-- própria profiles → recursão de RLS). O helper abaixo é SECURITY DEFINER,
-- devolve só o tenant do chamador e tem search_path fixo.
-- Escrita continua restrita ao próprio perfil (políticas self_* intactas).

CREATE OR REPLACE FUNCTION public.current_profile_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_profile_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_tenant_id() TO authenticated;

DROP POLICY IF EXISTS profiles_tenant_member_select ON public.profiles;
CREATE POLICY profiles_tenant_member_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_profile_tenant_id());
