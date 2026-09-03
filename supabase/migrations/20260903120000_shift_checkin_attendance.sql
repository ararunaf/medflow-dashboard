-- F4-S4: check-in/check-out real de plantão — base para o Check-in
-- Confirmation Agent. Sem isso, `shifts.status = 'completed'` era um
-- estado morto: a máquina de estado (F1-S3) já permitia a transição
-- assigned -> completed, mas nada no código nunca a disparava.

ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;

-- Não é possível ter check-out sem check-in prévio.
ALTER TABLE public.shift_assignments
  DROP CONSTRAINT IF EXISTS shift_assignments_checkout_requires_checkin;
ALTER TABLE public.shift_assignments
  ADD CONSTRAINT shift_assignments_checkout_requires_checkin
  CHECK (checked_out_at IS NULL OR checked_in_at IS NOT NULL);

-- shift_assignments: check-out confirmado conclui o plantão.
-- SECURITY DEFINER desde já (lição do fix em 20260903110000): o
-- profissional que faz o próprio check-out não tem UPDATE em `shifts`
-- via RLS (shifts_manager_update é só para gestor) — sem SECURITY
-- DEFINER, este UPDATE silenciosamente afetaria 0 linhas para uma
-- sessão real de profissional.
CREATE OR REPLACE FUNCTION public.complete_shift_on_checkout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.checked_out_at IS NOT NULL
     AND OLD.checked_out_at IS NULL
     AND NEW.assignment_status = 'confirmed' THEN
    UPDATE public.shifts
       SET status = 'completed'
     WHERE id = NEW.shift_id
       AND tenant_id = NEW.tenant_id
       AND status = 'assigned';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shift_assignments_complete_on_checkout ON public.shift_assignments;
CREATE TRIGGER shift_assignments_complete_on_checkout
  AFTER UPDATE OF checked_out_at ON public.shift_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_shift_on_checkout();
