-- SEC-PII-01 (+ SEC-PII-01A/01B/01C): least privilege de leitura e escrita
-- de PII do pipeline Capture, ownership imutável e integridade relacional
-- cross-owner. Versão final consolidada — a implantar uma única vez.
--
-- Achado original (auditoria externa, rodadas 1-3): capture_sessions,
-- capture_fields, capture_findings e capture_corrections tinham SELECT
-- liberado para QUALQUER membro autenticado do tenant (mesmo padrão já
-- identificado como risco LGPD e corrigido em 20260903170000 para
-- medical_production/medical_payouts). O dado exposto é sensível:
-- capture_sessions.metadata carregava ocrFullTextPreview (até 2000 chars de
-- texto bruto do OCR — nome, CPF, tudo) e semanticFallback.decisions[].
-- newValue (valor lido por IA externa para campos de baixa confiança,
-- incluindo o grupo "paciente").
--
-- Não usamos can_manage_billing() para leitura/escrita de PII de terceiros:
-- essa capability inclui o role 'financial', que não tem motivo clínico
-- para isso. Reaproveitamos is_operational_manager() (super_admin/
-- tenant_admin/coordinator, já existente) + self-access via created_by —
-- mesmo padrão "self OR manager" já validado em 20260903170000. INSERT não
-- muda em nenhuma tabela — já exigia created_by = auth.uid() (sem vetor de
-- impersonação); can_manage_billing() continua sendo o gate de "quem pode
-- iniciar uma captura", uma pergunta de acesso à feature, não de proteção
-- de PII de terceiros.
--
-- SEC-PII-01B (auditoria read-only) confirmou dois gaps além do SELECT/
-- UPDATE original:
--   1. capture_documents e capture_pages tinham ficado fora do hardening —
--      mesma vulnerabilidade (SELECT tenant-wide, UPDATE só can_manage_
--      billing() sem ownership). Corrigido aqui com o mesmo princípio.
--   2. session_id/page_id/document_id são FKs tenant-aware (bloqueiam
--      cross-tenant), mas nada impedia um owner de reassociar uma linha
--      seguinte (fields/findings/pages/documents) para um pai pertencente
--      a OUTRO owner do mesmo tenant — não é leitura indireta de PII
--      (SELECT continua filtrado pelo created_by da própria linha), mas é
--      contaminação/associação indevida no grafo Capture. Fechado com
--      trigger de "relationship guard" (self-or-manager também para o
--      alvo do relacionamento).
-- capture_corrections não tem policy de UPDATE/DELETE (RLS nega por
-- default) — nada a corrigir ali em nenhuma das três rodadas.

-- ---------------------------------------------------------------------------
-- capture_sessions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_sessions_select_tenant ON public.capture_sessions;
CREATE POLICY capture_sessions_select_self_or_manager
  ON public.capture_sessions FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS capture_sessions_update_billing ON public.capture_sessions;
CREATE POLICY capture_sessions_update_self_or_manager
  ON public.capture_sessions FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
    AND (public.is_operational_manager() OR created_by = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- capture_documents (SEC-PII-01C — fora do hardening original, corrigido agora)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_documents_select_tenant ON public.capture_documents;
CREATE POLICY capture_documents_select_self_or_manager
  ON public.capture_documents FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS capture_documents_update_billing ON public.capture_documents;
CREATE POLICY capture_documents_update_self_or_manager
  ON public.capture_documents FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- capture_pages (SEC-PII-01C — fora do hardening original, corrigido agora)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_pages_select_tenant ON public.capture_pages;
CREATE POLICY capture_pages_select_self_or_manager
  ON public.capture_pages FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS capture_pages_update_billing ON public.capture_pages;
CREATE POLICY capture_pages_update_self_or_manager
  ON public.capture_pages FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- capture_fields
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_fields_select_tenant ON public.capture_fields;
CREATE POLICY capture_fields_select_self_or_manager
  ON public.capture_fields FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND deleted_at IS NULL
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS capture_fields_update_billing ON public.capture_fields;
CREATE POLICY capture_fields_update_self_or_manager
  ON public.capture_fields FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- capture_findings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_findings_select_tenant ON public.capture_findings;
CREATE POLICY capture_findings_select_self_or_manager
  ON public.capture_findings FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

DROP POLICY IF EXISTS capture_findings_update_billing ON public.capture_findings;
CREATE POLICY capture_findings_update_self_or_manager
  ON public.capture_findings FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- capture_corrections (só SELECT — nunca teve UPDATE/DELETE policy)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS capture_corrections_select_tenant ON public.capture_corrections;
CREATE POLICY capture_corrections_select_self_or_manager
  ON public.capture_corrections FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.is_operational_manager() OR created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Saneamento de PII histórica já persistida em capture_sessions.metadata.
-- Idempotente — seguro rodar mais de uma vez; não toca em nenhuma outra
-- chave de metadata (capturePhase, ocr summary, eventos, etc.).
-- ---------------------------------------------------------------------------

-- ocrFullTextPreview: texto bruto do OCR (nome, CPF, etc.), nunca lido por
-- nenhum código em src/ (confirmado por grep) — remoção não afeta funcionalidade.
UPDATE public.capture_sessions
SET metadata = metadata - 'ocrFullTextPreview'
WHERE metadata ? 'ocrFullTextPreview';

-- semanticFallback.decisions[].newValue: valor lido por IA externa para
-- campos de baixa confiança (pode ser nome/CPF do grupo "paciente").
-- Reconstrói o array preservando todos os outros campos de cada decisão.
UPDATE public.capture_sessions
SET metadata = jsonb_set(
  metadata,
  '{semanticFallback,decisions}',
  COALESCE(
    (
      SELECT jsonb_agg(elem - 'newValue')
      FROM jsonb_array_elements(metadata #> '{semanticFallback,decisions}') AS elem
    ),
    '[]'::jsonb
  )
)
WHERE jsonb_typeof(metadata #> '{semanticFallback,decisions}') = 'array';

-- ---------------------------------------------------------------------------
-- Ownership imutável: tenant_id/created_by nunca mudam em UPDATE.
-- Independe de role/RLS — nem um manager nem o service_role reatribuem a
-- linha para outro tenant/dono via UPDATE. Sem isso, o self-or-manager de
-- USING/WITH CHECK sozinho não impede que a checagem seja satisfeita antes
-- e depois com valores diferentes. Mesmo padrão de trigger BEFORE UPDATE já
-- usado em 20250513230000 (financial_closing_competence_is_immutable).
-- Estendida em SEC-PII-01C para capture_documents/capture_pages, que
-- também passaram a ter UPDATE self-or-manager nesta migration.
-- Nenhum código em src/lib/capture atualiza created_by/tenant_id hoje
-- (confirmado por grep) — sem impacto funcional esperado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_capture_ownership_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'tenant_id é imutável — não pode ser alterado via UPDATE (%).', TG_TABLE_NAME
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'created_by é imutável — não pode ser alterado via UPDATE (%).', TG_TABLE_NAME
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_sessions_ownership_immutable ON public.capture_sessions;
CREATE TRIGGER capture_sessions_ownership_immutable
  BEFORE UPDATE ON public.capture_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_ownership_immutable();

DROP TRIGGER IF EXISTS capture_documents_ownership_immutable ON public.capture_documents;
CREATE TRIGGER capture_documents_ownership_immutable
  BEFORE UPDATE ON public.capture_documents
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_ownership_immutable();

DROP TRIGGER IF EXISTS capture_pages_ownership_immutable ON public.capture_pages;
CREATE TRIGGER capture_pages_ownership_immutable
  BEFORE UPDATE ON public.capture_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_ownership_immutable();

DROP TRIGGER IF EXISTS capture_fields_ownership_immutable ON public.capture_fields;
CREATE TRIGGER capture_fields_ownership_immutable
  BEFORE UPDATE ON public.capture_fields
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_ownership_immutable();

DROP TRIGGER IF EXISTS capture_findings_ownership_immutable ON public.capture_findings;
CREATE TRIGGER capture_findings_ownership_immutable
  BEFORE UPDATE ON public.capture_findings
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_ownership_immutable();

-- ---------------------------------------------------------------------------
-- SEC-PII-01C — Integridade relacional cross-owner.
--
-- As FKs (tenant_id, x_id) já impedem cross-tenant (achado SEC-PII-01B).
-- O que falta: um owner não pode reassociar uma linha própria (fields/
-- findings/pages/documents) para um pai (session/page/document) pertencente
-- a OUTRO owner do mesmo tenant — só porque a FK aceita, já que ela só
-- valida "mesmo tenant", nunca "mesmo dono". Regra aplicada: mesmo tenant
-- (já garantido) + ownership compatível (dono do alvo = auth.uid()) OU
-- is_operational_manager(). Helpers SECURITY DEFINER — precisam enxergar o
-- created_by do alvo independente da RLS de SELECT do próprio ator (ex.:
-- ator não veria a sessão-alvo via SELECT, mas isso não deve mudar o
-- resultado do teste de ownership em si).
-- Nenhum código em src/lib/capture muda session_id/page_id/document_id
-- após o insert (confirmado por grep) — sem impacto funcional esperado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_session_owned_by_actor(p_session_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.capture_sessions s
    WHERE s.id = p_session_id AND s.tenant_id = p_tenant_id AND s.created_by = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.capture_session_owned_by_actor(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_session_owned_by_actor(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.capture_page_owned_by_actor(p_page_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.capture_pages p
    WHERE p.id = p_page_id AND p.tenant_id = p_tenant_id AND p.created_by = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.capture_page_owned_by_actor(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_page_owned_by_actor(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.capture_document_owned_by_actor(p_document_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.capture_documents d
    WHERE d.id = p_document_id AND d.tenant_id = p_tenant_id AND d.created_by = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.capture_document_owned_by_actor(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.capture_document_owned_by_actor(uuid, uuid) TO authenticated;

-- capture_documents.session_id
CREATE OR REPLACE FUNCTION public.trg_capture_documents_relationship_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_session_owned_by_actor(NEW.session_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'session_id só pode ser reassociado a uma sessão do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_documents_relationship_guard ON public.capture_documents;
CREATE TRIGGER capture_documents_relationship_guard
  BEFORE UPDATE ON public.capture_documents
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_documents_relationship_guard();

-- capture_pages.session_id / capture_pages.document_id
CREATE OR REPLACE FUNCTION public.trg_capture_pages_relationship_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_session_owned_by_actor(NEW.session_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'session_id só pode ser reassociado a uma sessão do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.document_id IS DISTINCT FROM OLD.document_id THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_document_owned_by_actor(NEW.document_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'document_id só pode ser reassociado a um documento do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_pages_relationship_guard ON public.capture_pages;
CREATE TRIGGER capture_pages_relationship_guard
  BEFORE UPDATE ON public.capture_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_pages_relationship_guard();

-- capture_fields.session_id / capture_fields.page_id (page_id é nullable —
-- só valida quando o novo valor não é NULL; "soltar" o vínculo, setando
-- NULL, não associa a nada e por isso não precisa de ownership check).
CREATE OR REPLACE FUNCTION public.trg_capture_fields_relationship_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_session_owned_by_actor(NEW.session_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'session_id só pode ser reassociado a uma sessão do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.page_id IS DISTINCT FROM OLD.page_id AND NEW.page_id IS NOT NULL THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_page_owned_by_actor(NEW.page_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'page_id só pode ser reassociado a uma página do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_fields_relationship_guard ON public.capture_fields;
CREATE TRIGGER capture_fields_relationship_guard
  BEFORE UPDATE ON public.capture_fields
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_fields_relationship_guard();

-- capture_findings.session_id
CREATE OR REPLACE FUNCTION public.trg_capture_findings_relationship_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.session_id IS DISTINCT FROM OLD.session_id THEN
    IF NOT (
      public.is_operational_manager()
      OR public.capture_session_owned_by_actor(NEW.session_id, NEW.tenant_id)
    ) THEN
      RAISE EXCEPTION 'session_id só pode ser reassociado a uma sessão do próprio usuário (ou por operational manager).'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_findings_relationship_guard ON public.capture_findings;
CREATE TRIGGER capture_findings_relationship_guard
  BEFORE UPDATE ON public.capture_findings
  FOR EACH ROW EXECUTE FUNCTION public.trg_capture_findings_relationship_guard();
