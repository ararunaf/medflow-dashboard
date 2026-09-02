-- MedFlow-IA: máquina de estados real para tiss_guides / tiss_denials / tiss_denial_appeals.
-- F1-S3: hoje a transição de status é só disciplina de UI (setTissGuideStatus,
-- updateTissDenialStatus, updateTissDenialAppealStatus aceitam qualquer valor
-- do enum). Esta migração move a validação para o banco, no mesmo padrão já
-- usado em shifts (enforce_shift_status_transition, 20250512000002).
--
-- Os grafos abaixo refletem exatamente o que a aplicação já faz hoje
-- (botões da UI em src/routes/tiss.tsx + createTissDenialAppeal cascateando
-- para tiss_denials.status = 'appealed') — não introduzem regra de negócio
-- nova, só passam a rejeitar o que a UI nunca ofereceu mas o campo aceitava.

-- ---------------------------------------------------------------------------
-- tiss_guides.status
--   draft -> pending_review -> approved -> billed
--                            -> denied
--   billed e denied são terminais (sem fluxo de reabertura hoje).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tiss_guide_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'draft' AND NEW.status = 'pending_review' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'pending_review' AND NEW.status IN ('approved', 'denied') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'approved' AND NEW.status = 'billed' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IN ('billed', 'denied') THEN
    RAISE EXCEPTION 'tiss_guides status % is terminal and cannot transition to %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RAISE EXCEPTION 'invalid tiss_guides status transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS tiss_guides_status_transition ON public.tiss_guides;
CREATE TRIGGER tiss_guides_status_transition
  BEFORE UPDATE OF status ON public.tiss_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tiss_guide_status_transition();

-- ---------------------------------------------------------------------------
-- tiss_denials.status
--   identified -> under_review -> appealed -> accepted
--                               -> accepted
--                    -> accepted
--   qualquer estado não-terminal -> reversed (botão "Reverter" da UI,
--   disponível em toda guia glosada até ser revertida).
--   reversed é terminal.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tiss_denial_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'reversed' THEN
    RAISE EXCEPTION 'tiss_denials status reversed is terminal and cannot transition to %', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- "Reverter" — disponível em qualquer estado não-terminal.
  IF NEW.status = 'reversed' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'identified' AND NEW.status IN ('under_review', 'appealed', 'accepted') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'under_review' AND NEW.status IN ('appealed', 'accepted') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'appealed' AND NEW.status = 'accepted' THEN
    RETURN NEW;
  END IF;
  IF OLD.status = 'accepted' THEN
    RAISE EXCEPTION 'tiss_denials status accepted only transitions to reversed, not %', NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RAISE EXCEPTION 'invalid tiss_denials status transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS tiss_denials_status_transition ON public.tiss_denials;
CREATE TRIGGER tiss_denials_status_transition
  BEFORE UPDATE OF status ON public.tiss_denials
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tiss_denial_status_transition();

-- ---------------------------------------------------------------------------
-- tiss_denial_appeals.appeal_status
--   pending -> submitted -> under_review -> accepted | rejected
--                         -> withdrawn         -> withdrawn
--                    -> withdrawn
--   accepted / rejected / withdrawn são terminais.
--
-- createTissDenialAppeal sempre insere com appeal_status = 'submitted'
-- (pending é só o default de coluna, hoje nunca inserido) — mantido no
-- grafo por completude e para não quebrar um insert futuro que use o
-- default.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_tiss_denial_appeal_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.appeal_status = OLD.appeal_status THEN
    RETURN NEW;
  END IF;

  IF OLD.appeal_status = 'pending' AND NEW.appeal_status = 'submitted' THEN
    RETURN NEW;
  END IF;
  IF OLD.appeal_status = 'submitted' AND NEW.appeal_status IN ('under_review', 'withdrawn') THEN
    RETURN NEW;
  END IF;
  IF OLD.appeal_status = 'under_review' AND NEW.appeal_status IN ('accepted', 'rejected', 'withdrawn') THEN
    RETURN NEW;
  END IF;
  IF OLD.appeal_status IN ('accepted', 'rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'tiss_denial_appeals appeal_status % is terminal and cannot transition to %',
      OLD.appeal_status, NEW.appeal_status
      USING ERRCODE = 'check_violation';
  END IF;

  RAISE EXCEPTION 'invalid tiss_denial_appeals appeal_status transition % -> %',
    OLD.appeal_status, NEW.appeal_status
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS tiss_denial_appeals_status_transition ON public.tiss_denial_appeals;
CREATE TRIGGER tiss_denial_appeals_status_transition
  BEFORE UPDATE OF appeal_status ON public.tiss_denial_appeals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_tiss_denial_appeal_status_transition();
