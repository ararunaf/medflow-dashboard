-- F5-S3: achado real de auditoria interna de segurança (preparo para
-- auditoria externa) — medical_production/medical_payouts/
-- medical_payout_items tinham SELECT liberado para QUALQUER membro
-- autenticado do tenant, sem checar papel nem dono. Escrita já era
-- corretamente restrita a can_manage_billing() (coordinator/tenant_admin/
-- super_admin/financial); a leitura não. Resultado real: num tenant
-- multiprofissional, qualquer profissional conseguia consultar a
-- produção/repasse individual de QUALQUER outro profissional — dado
-- pessoal sensível (remuneração) exposto sem necessidade, risco real de
-- LGPD, não só teórico.
--
-- Corrigido para: gestor de billing continua vendo tudo (necessário para
-- fechar competência); profissional só vê a própria produção/repasse
-- (professional_id = current_professional_id()) — mesmo modelo de "self
-- vs any" já usado em assignments/attendance neste schema.
--
-- payout_rules (fórmula de cálculo, não valor individual pago) e
-- medical_payout_audit (trilha de auditoria) ficaram de fora
-- deliberadamente — são dados de política/auditoria, não o valor pessoal
-- em si; decisão de produto sobre se também devem ser restritos fica para
-- quando/se a auditoria externa formal recomendar.

DROP POLICY IF EXISTS medical_production_select_tenant ON public.medical_production;
CREATE POLICY medical_production_select_self_or_billing
  ON public.medical_production FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.can_manage_billing() OR professional_id = public.current_professional_id())
  );

DROP POLICY IF EXISTS medical_payouts_select_tenant ON public.medical_payouts;
CREATE POLICY medical_payouts_select_self_or_billing
  ON public.medical_payouts FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.current_tenant_ids())
    AND (public.can_manage_billing() OR professional_id = public.current_professional_id())
  );

DROP POLICY IF EXISTS medical_payout_items_select_tenant ON public.medical_payout_items;
CREATE POLICY medical_payout_items_select_self_or_billing
  ON public.medical_payout_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.medical_payouts p
      WHERE p.id = medical_payout_items.payout_id
        AND p.tenant_id IN (SELECT public.current_tenant_ids())
        AND (public.can_manage_billing() OR p.professional_id = public.current_professional_id())
    )
  );
