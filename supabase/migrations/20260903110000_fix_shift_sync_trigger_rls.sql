-- Corrige um bug real e pré-existente (não introduzido nesta sprint, achado
-- ao verificar F4-S4 com sessão real de profissional em vez de service_role):
--
-- `sync_shift_status_from_assignment()` (20250512000002_operational_rbac_state.sql)
-- sincroniza `shifts.status` a partir de `shift_assignments.assignment_status`
-- via trigger, mas é SECURITY INVOKER (default) — executa com o papel de
-- quem disparou o trigger. Quando um PROFISSIONAL confirma a própria
-- atribuição (auto-atribuição real do F4-S1, `assignments:confirm:self`), a
-- linha de `shift_assignments` é atualizada com sucesso, mas o UPDATE
-- interno em `public.shifts` (dentro do trigger) precisa passar pela RLS de
-- `shifts_manager_update`, que exige `is_operational_manager()` — falso
-- para o profissional. RLS não lança erro: filtra a linha do UPDATE, então
-- o UPDATE afeta 0 linhas silenciosamente. Resultado real em produção:
-- `shift_assignments.assignment_status` vira 'confirmed' corretamente, mas
-- `shifts.status` NUNCA sai de 'open' — o plantão preenchido continua
-- aparecendo como aberto para outros profissionais (a exclusividade da
-- atribuição em si continua garantida pelo índice parcial, mas a
-- exibição/listagem fica errada). Mesmo problema na direção inversa
-- (profissional recusa a própria atribuição confirmada — `assigned` nunca
-- volta para `open`).
--
-- Confirmado empiricamente: sessão real de profissional (anon key +
-- signInWithPassword, não service_role) contra o staging real, antes desta
-- migration, deixava `shifts.status = 'open'` mesmo após auto-confirmar.
--
-- Correção: SECURITY DEFINER, para que o UPDATE interno rode com o
-- privilégio de quem definiu a função (o dono das tabelas), contornando a
-- RLS de `shifts` para este UPDATE específico e estritamente controlado —
-- mesmo padrão recomendado pela documentação do Postgres/Supabase para
-- trigger que precisa escrever em tabela que o papel disparador não pode
-- escrever diretamente. `SET search_path = public` já estava presente
-- (mantido — obrigatório em função SECURITY DEFINER para não ficar
-- vulnerável a search_path hijacking).
CREATE OR REPLACE FUNCTION public.sync_shift_status_from_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift_id uuid;
  v_tenant_id uuid;
  v_has_confirmed boolean;
  v_current_status public.shift_status;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_shift_id := OLD.shift_id;
    v_tenant_id := OLD.tenant_id;
  ELSE
    v_shift_id := NEW.shift_id;
    v_tenant_id := NEW.tenant_id;
  END IF;

  SELECT s.status INTO v_current_status
  FROM public.shifts s
  WHERE s.id = v_shift_id
    AND s.tenant_id = v_tenant_id;

  IF v_current_status IS NULL OR v_current_status IN ('cancelled', 'completed') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    WHERE sa.shift_id = v_shift_id
      AND sa.tenant_id = v_tenant_id
      AND sa.assignment_status = 'confirmed'
  ) INTO v_has_confirmed;

  IF v_has_confirmed AND v_current_status <> 'assigned' THEN
    UPDATE public.shifts
       SET status = 'assigned'
     WHERE id = v_shift_id
       AND tenant_id = v_tenant_id;
  ELSIF NOT v_has_confirmed AND v_current_status = 'assigned' THEN
    UPDATE public.shifts
       SET status = 'open'
     WHERE id = v_shift_id
       AND tenant_id = v_tenant_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
