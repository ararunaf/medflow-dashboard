-- MedFlow-IA: RBAC operacional + state machine via Postgres
-- Defesa-em-profundidade: além das validações do app, o banco rejeita
-- escritas inválidas (transições proibidas, dados fora do tenant, etc.).

-- ---------------------------------------------------------------------------
-- Helpers de identidade / role do usuário autenticado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_professional_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT pr.id
  FROM public.professionals pr
  WHERE pr.profile_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_professional_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_professional_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_operational_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'tenant_admin', 'coordinator');
$$;

REVOKE ALL ON FUNCTION public.is_operational_manager() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_operational_manager() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'tenant_admin');
$$;

REVOKE ALL ON FUNCTION public.is_tenant_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: substitui as policies FOR ALL por SELECT amplo + write por role
--      (mantém current_tenant_ids() como única fonte de isolamento)
-- ---------------------------------------------------------------------------

-- units -----------------------------------------------------------------------
DROP POLICY IF EXISTS units_tenant_isolation ON public.units;

CREATE POLICY units_tenant_read
  ON public.units FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY units_tenant_admin_insert
  ON public.units FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

CREATE POLICY units_tenant_admin_update
  ON public.units FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

CREATE POLICY units_tenant_admin_delete
  ON public.units FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

-- departments -----------------------------------------------------------------
DROP POLICY IF EXISTS departments_tenant_isolation ON public.departments;

CREATE POLICY departments_tenant_read
  ON public.departments FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY departments_tenant_admin_insert
  ON public.departments FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

CREATE POLICY departments_tenant_admin_update
  ON public.departments FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

CREATE POLICY departments_tenant_admin_delete
  ON public.departments FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

-- schedules -------------------------------------------------------------------
DROP POLICY IF EXISTS schedules_tenant_isolation ON public.schedules;

CREATE POLICY schedules_tenant_read
  ON public.schedules FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY schedules_manager_insert
  ON public.schedules FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY schedules_manager_update
  ON public.schedules FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY schedules_admin_delete
  ON public.schedules FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

-- shifts ----------------------------------------------------------------------
DROP POLICY IF EXISTS shifts_tenant_isolation ON public.shifts;

CREATE POLICY shifts_tenant_read
  ON public.shifts FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY shifts_manager_insert
  ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY shifts_manager_update
  ON public.shifts FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

CREATE POLICY shifts_admin_delete
  ON public.shifts FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_tenant_admin()
  );

-- shift_assignments ----------------------------------------------------------
DROP POLICY IF EXISTS shift_assignments_tenant_isolation ON public.shift_assignments;

CREATE POLICY shift_assignments_tenant_read
  ON public.shift_assignments FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

-- Managers podem criar para qualquer profissional do tenant.
-- Profissional só pode criar atribuição se for para si mesmo (auto-candidatura).
CREATE POLICY shift_assignments_insert
  ON public.shift_assignments FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  );

-- Managers podem atualizar qualquer assignment (confirmar/rejeitar em nome).
-- Profissional só pode atualizar a própria atribuição.
CREATE POLICY shift_assignments_update
  ON public.shift_assignments FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  );

CREATE POLICY shift_assignments_admin_delete
  ON public.shift_assignments FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

-- shift_swap_requests --------------------------------------------------------
DROP POLICY IF EXISTS shift_swap_requests_tenant_isolation ON public.shift_swap_requests;

CREATE POLICY shift_swap_requests_tenant_read
  ON public.shift_swap_requests FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

-- Apenas o próprio profissional solicita troca (requester_professional_id = você).
CREATE POLICY shift_swap_requests_insert
  ON public.shift_swap_requests FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.current_user_role() = 'professional'
    AND requester_professional_id = public.current_professional_id()
  );

-- Managers aprovam/negam.
-- Requester pode cancelar a própria solicitação (status -> cancelled) — checagem reforçada pelo trigger de transição.
CREATE POLICY shift_swap_requests_update
  ON public.shift_swap_requests FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR requester_professional_id = public.current_professional_id()
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR requester_professional_id = public.current_professional_id()
    )
  );

CREATE POLICY shift_swap_requests_admin_delete
  ON public.shift_swap_requests FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND public.is_operational_manager()
  );

-- availability ----------------------------------------------------------------
DROP POLICY IF EXISTS availability_tenant_isolation ON public.availability;

CREATE POLICY availability_tenant_read
  ON public.availability FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.current_tenant_ids()));

CREATE POLICY availability_insert
  ON public.availability FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  );

CREATE POLICY availability_update
  ON public.availability FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  );

CREATE POLICY availability_delete
  ON public.availability FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (
      public.is_operational_manager()
      OR (
        public.current_user_role() = 'professional'
        AND professional_id = public.current_professional_id()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Triggers de state-machine / invariantes de domínio
-- ---------------------------------------------------------------------------

-- shifts: schedule arquivado não recebe novos shifts
CREATE OR REPLACE FUNCTION public.enforce_shift_schedule_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_schedule_status public.schedule_status;
BEGIN
  SELECT s.status INTO v_schedule_status
  FROM public.schedules s
  WHERE s.id = NEW.schedule_id
    AND s.tenant_id = NEW.tenant_id;

  IF v_schedule_status IS NULL THEN
    RAISE EXCEPTION 'shift schedule % not found in tenant', NEW.schedule_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF TG_OP = 'INSERT' AND v_schedule_status = 'archived' THEN
    RAISE EXCEPTION 'schedule % is archived and cannot receive new shifts', NEW.schedule_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shifts_schedule_active_check ON public.shifts;
CREATE TRIGGER shifts_schedule_active_check
  BEFORE INSERT ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shift_schedule_active();

-- shifts: transições válidas de status
CREATE OR REPLACE FUNCTION public.enforce_shift_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- open -> assigned | cancelled
  IF OLD.status = 'open' AND NEW.status IN ('assigned', 'cancelled') THEN
    RETURN NEW;
  END IF;
  -- assigned -> open (cancelamento do confirmed) | completed | cancelled
  IF OLD.status = 'assigned' AND NEW.status IN ('open', 'completed', 'cancelled') THEN
    RETURN NEW;
  END IF;
  -- estados terminais
  IF OLD.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'shift status % is terminal and cannot transition to %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RAISE EXCEPTION 'invalid shift status transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS shifts_status_transition ON public.shifts;
CREATE TRIGGER shifts_status_transition
  BEFORE UPDATE OF status ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_shift_status_transition();

-- shift_assignments: shift cancelado/completed não aceita assignments
CREATE OR REPLACE FUNCTION public.enforce_assignment_shift_open()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_shift_status public.shift_status;
BEGIN
  SELECT s.status INTO v_shift_status
  FROM public.shifts s
  WHERE s.id = NEW.shift_id
    AND s.tenant_id = NEW.tenant_id;

  IF v_shift_status IS NULL THEN
    RAISE EXCEPTION 'shift % not found in tenant', NEW.shift_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_shift_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'shift % is %, cannot receive new assignments', NEW.shift_id, v_shift_status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shift_assignments_shift_open_check ON public.shift_assignments;
CREATE TRIGGER shift_assignments_shift_open_check
  BEFORE INSERT ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_assignment_shift_open();

-- shift_assignments: pending -> confirmed | rejected (irreversíveis)
CREATE OR REPLACE FUNCTION public.enforce_assignment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.assignment_status = OLD.assignment_status THEN
    RETURN NEW;
  END IF;

  IF OLD.assignment_status = 'pending'
     AND NEW.assignment_status IN ('confirmed', 'rejected') THEN
    RETURN NEW;
  END IF;

  -- Permite confirmed -> rejected (revogação operacional) p/ liberar plantão.
  IF OLD.assignment_status = 'confirmed'
     AND NEW.assignment_status = 'rejected' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid assignment status transition % -> %', OLD.assignment_status, NEW.assignment_status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS shift_assignments_status_transition ON public.shift_assignments;
CREATE TRIGGER shift_assignments_status_transition
  BEFORE UPDATE OF assignment_status ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_assignment_status_transition();

-- shift_assignments: sincroniza status do shift conforme confirmações
CREATE OR REPLACE FUNCTION public.sync_shift_status_from_assignment()
RETURNS trigger
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS shift_assignments_sync_shift ON public.shift_assignments;
CREATE TRIGGER shift_assignments_sync_shift
  AFTER INSERT OR UPDATE OF assignment_status OR DELETE ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_shift_status_from_assignment();

-- shift_swap_requests: invariantes na criação
--   1. shift no futuro
--   2. shift não cancelado/concluído
--   3. requester tem assignment confirmed neste shift
--   4. target diferente do requester (já no CHECK), e em condições válidas
CREATE OR REPLACE FUNCTION public.enforce_swap_request_preconditions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_shift_starts_at timestamptz;
  v_shift_status public.shift_status;
  v_requester_confirmed boolean;
BEGIN
  SELECT s.starts_at, s.status
    INTO v_shift_starts_at, v_shift_status
    FROM public.shifts s
   WHERE s.id = NEW.shift_id
     AND s.tenant_id = NEW.tenant_id;

  IF v_shift_starts_at IS NULL THEN
    RAISE EXCEPTION 'swap shift % not found in tenant', NEW.shift_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_shift_starts_at <= now() THEN
    RAISE EXCEPTION 'swap can only target future shifts (starts_at=%)', v_shift_starts_at
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_shift_status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'swap not allowed on shift with status %', v_shift_status
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.shift_assignments sa
    WHERE sa.shift_id = NEW.shift_id
      AND sa.tenant_id = NEW.tenant_id
      AND sa.professional_id = NEW.requester_professional_id
      AND sa.assignment_status = 'confirmed'
  ) INTO v_requester_confirmed;

  IF NOT v_requester_confirmed THEN
    RAISE EXCEPTION 'requester does not own a confirmed assignment for shift %', NEW.shift_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shift_swap_requests_preconditions ON public.shift_swap_requests;
CREATE TRIGGER shift_swap_requests_preconditions
  BEFORE INSERT ON public.shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_swap_request_preconditions();

-- shift_swap_requests: transições e quem pode aprovar/negar
CREATE OR REPLACE FUNCTION public.enforce_swap_request_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'swap request status % is terminal', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'cancelled' THEN
    IF auth.uid() IS NOT NULL
       AND NOT (
         OLD.requester_professional_id = public.current_professional_id()
         OR public.is_operational_manager()
       ) THEN
      RAISE EXCEPTION 'only requester or operational manager can cancel swap request'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IN ('approved', 'denied') THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_operational_manager() THEN
      RAISE EXCEPTION 'only coordinator/tenant_admin/super_admin can % swap requests', NEW.status
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'invalid swap request status transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS shift_swap_requests_status_transition ON public.shift_swap_requests;
CREATE TRIGGER shift_swap_requests_status_transition
  BEFORE UPDATE OF status ON public.shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_swap_request_status_transition();

-- ---------------------------------------------------------------------------
-- Comentários de documentação
-- ---------------------------------------------------------------------------
COMMENT ON FUNCTION public.current_user_role() IS 'Role do auth.uid() atual (RBAC).';
COMMENT ON FUNCTION public.current_professional_id() IS 'ID em professionals do auth.uid() atual, se houver.';
COMMENT ON FUNCTION public.is_operational_manager() IS 'true quando role ∈ {super_admin, tenant_admin, coordinator}.';
COMMENT ON FUNCTION public.is_tenant_admin() IS 'true quando role ∈ {super_admin, tenant_admin}.';
