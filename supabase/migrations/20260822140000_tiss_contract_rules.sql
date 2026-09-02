-- MEDICFLOW-CONTRACT-INTELLIGENCE-01-DATA — Regras contratuais por operadora como dado.
-- Substitui progressivamente src/lib/capture/contract/registry/default-contract-rules.ts
-- (array hardcoded em TypeScript) por uma tabela editável sem deploy.
--
-- Seed inicial: transcrição literal das regras já em produção em
-- default-contract-rules.ts (DEFAULT_CONTRACT_REGISTRY.versions) — mesmo
-- conteúdo, comportamento inalterado no cutover. A regra CTR-UNI-CONFLICT
-- (fixture de teste de resolução de conflito, nunca usada em produção —
-- getRulesForOperator() nunca a lê) não foi trazida para o seed.
--
-- rule_id NÃO é chave única global de propósito: a mesma regra pode valer
-- para mais de um par (operadora, contrato, versão) — ver CTR-UNI-005, que
-- aparece tanto em UNIMED-NACIONAL-2026 quanto em UNIMED-REGIONAL-2025.

CREATE TABLE IF NOT EXISTS public.tiss_contract_rules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rule_id text NOT NULL,
  registry_version text NOT NULL,
  effective_from date NOT NULL,
  effective_to date NULL,
  tenant_id text NULL,
  operator text NOT NULL,
  contract text NOT NULL,
  guide_type text NOT NULL DEFAULT '*',
  procedure_type text NOT NULL DEFAULT '*',
  priority integer NOT NULL,
  description text NOT NULL,
  justification text NOT NULL,
  legal_reference text NOT NULL,
  business_reference text NOT NULL,
  severity text NOT NULL,
  audit_rule_ids jsonb NULL,
  audit_fields jsonb NULL,
  audit_categories jsonb NULL,
  estimated_financial_impact_cents integer NULL,
  base_denial_risk integer NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tiss_contract_rules_lookup_idx
  ON public.tiss_contract_rules (operator, contract, registry_version);

CREATE UNIQUE INDEX IF NOT EXISTS tiss_contract_rules_identity_uidx
  ON public.tiss_contract_rules (rule_id, registry_version, contract);

ALTER TABLE public.tiss_contract_rules ENABLE ROW LEVEL SECURITY;

-- Service role / backend server-side; sem policies de anon/authenticated
-- (leitura exclusiva via bindServerContractRulesStore() no boot do servidor).

INSERT INTO public.tiss_contract_rules
  (rule_id, registry_version, effective_from, effective_to, operator, contract,
   guide_type, procedure_type, priority, description, justification,
   legal_reference, business_reference, severity, audit_rule_ids, audit_fields,
   audit_categories, estimated_financial_impact_cents, base_denial_risk)
VALUES
  ('CTR-UNI-001', '2026.1', '2026-01-01', NULL, '123456', 'UNIMED-NACIONAL-2026',
   '*', '*', 100,
   'Registro ANS obrigatório para identificação da operadora',
   'Contrato Unimed Nacional exige identificação inequívoca da operadora via registro ANS para processamento do lote.',
   'RN 305/2012 ANS — Identificação da operadora', 'Manual Unimed Nacional v2026 — Cap. 3.1',
   'critico', '["OPR-001"]'::jsonb, '["operator_ans_code"]'::jsonb, NULL, 25000, 95),

  ('CTR-UNI-002', '2026.1', '2026-01-01', NULL, '123456', 'UNIMED-NACIONAL-2026',
   'guia_consulta', 'consulta', 90,
   'Autorização prévia obrigatória para consultas eletivas',
   'Consultas eletivas exigem senha de autorização válida conforme tabela de cobertura do contrato coletivo.',
   'Lei 9.656/98 Art. 12 — Cobertura assistencial', 'Contrato Coletivo Unimed 2026 — Cláusula 7.3',
   'alto', '["AUT-001","AUT-002"]'::jsonb, '["authorization_password","authorization_number"]'::jsonb, NULL, 25000, 80),

  ('CTR-UNI-003', '2026.1', '2026-01-01', NULL, '123456', 'UNIMED-NACIONAL-2026',
   'guia_sadt', 'exame', 85,
   'CID-10 obrigatório para procedimentos SP/SADT',
   'Procedimentos diagnósticos requerem indicação clínica (CID-10) para validação de pertinência técnica.',
   'RN 305/2012 — Dados de identificação do atendimento', 'Manual TISS 4.01.00 — Grupo diagnóstico',
   'alto', '["DGN-001"]'::jsonb, '["cid_code"]'::jsonb, NULL, 15000, 70),

  ('CTR-UNI-004', '2026.1', '2026-01-01', NULL, '123456', 'UNIMED-NACIONAL-2026',
   '*', '*', 80,
   'Código TUSS deve constar na tabela contratual vigente',
   'Procedimentos fora da tabela contratual ou com código inválido são glosados integralmente.',
   'RN 259/2011 ANS — Rol de procedimentos', 'Tabela TUSS Unimed 2026 — Anexo II',
   'critico', '["PRC-001","PRC-002"]'::jsonb, '["procedure_code"]'::jsonb, NULL, 50000, 90),

  ('CTR-UNI-005', '2026.1', '2026-01-01', NULL, '123456', 'UNIMED-NACIONAL-2026',
   'guia_honorario', 'cirurgia', 75,
   'Honorários cirúrgicos exigem equipe completa identificada',
   'Guia de honorários deve conter CRM e nome de todos os profissionais participantes da equipe cirúrgica.',
   'RN 305/2012 — Dados do executante', 'Contrato Regional Unimed 2025 — Cláusula 12.1',
   'alto', '["EXE-001","EXE-002"]'::jsonb, '["executor_crm","executor_name"]'::jsonb, NULL, 80000, 65),

  ('CTR-UNI-005', '2025.2', '2025-06-01', '2025-12-31', '123456', 'UNIMED-REGIONAL-2025',
   'guia_honorario', 'cirurgia', 75,
   'Honorários cirúrgicos exigem equipe completa identificada',
   'Guia de honorários deve conter CRM e nome de todos os profissionais participantes da equipe cirúrgica.',
   'RN 305/2012 — Dados do executante', 'Contrato Regional Unimed 2025 — Cláusula 12.1',
   'alto', '["EXE-001","EXE-002"]'::jsonb, '["executor_crm","executor_name"]'::jsonb, NULL, 80000, 65),

  ('CTR-BRA-001', '2026.1', '2026-01-01', NULL, '005711', 'BRADESCO-SAUDE-2026',
   '*', '*', 100,
   'Identificação da operadora via registro ANS Bradesco Saúde',
   'Bradesco Saúde exige registro ANS 005711 para conciliação de lotes e validação de rede credenciada.',
   'RN 305/2012 ANS', 'Manual Bradesco Saúde v2026 — Seção 2.1',
   'critico', '["OPR-001","OPR-002"]'::jsonb, '["operator_ans_code"]'::jsonb, NULL, 30000, 92),

  ('CTR-BRA-002', '2026.1', '2026-01-01', NULL, '005711', 'BRADESCO-SAUDE-2026',
   'guia_sadt', '*', 90,
   'Autorização obrigatória para SP/SADT acima de R$ 500',
   'Procedimentos SP/SADT com valor superior a R$ 500,00 exigem autorização prévia com senha válida.',
   'Lei 9.656/98 Art. 12', 'Contrato Bradesco Empresarial 2026 — Anexo C',
   'alto', '["AUT-001"]'::jsonb, '["authorization_password"]'::jsonb, NULL, 50000, 85),

  ('CTR-BRA-003', '2026.1', '2026-01-01', NULL, '005711', 'BRADESCO-SAUDE-2026',
   'guia_consulta', 'consulta', 70,
   'Carteirinha do beneficiário obrigatória',
   'Identificação do beneficiário via número da carteirinha é requisito para elegibilidade no momento do atendimento.',
   'RN 305/2012 — Dados do beneficiário', 'Manual Bradesco Saúde — Cap. 4.2',
   'critico', '["PAC-002"]'::jsonb, '["beneficiary_card_number"]'::jsonb, NULL, 25000, 88),

  ('CTR-AMI-001', '2026.1', '2026-01-01', NULL, '326305', 'AMIL-ONE-2026',
   '*', '*', 100,
   'Registro ANS Amil obrigatório',
   'Amil One exige identificação via ANS 326305 para processamento TISS.',
   'RN 305/2012 ANS', 'Manual Amil One 2026',
   'critico', '["OPR-001"]'::jsonb, '["operator_ans_code"]'::jsonb, NULL, 25000, 90),

  ('CTR-AMI-002', '2026.1', '2026-01-01', NULL, '326305', 'AMIL-ONE-2026',
   'guia_sadt', 'exame', 85,
   'Laudo/relatório obrigatório para exames de alta complexidade',
   'Exames de alta complexidade exigem documentação complementar conforme rol ANS e contrato Amil.',
   'RN 259/2011 ANS — Rol de procedimentos', 'Contrato Amil One — Cláusula 9.4',
   'medio', NULL, NULL, '["procedimentos"]'::jsonb, 12000, 55),

  ('CTR-SUL-001', '2026.1', '2026-01-01', NULL, '006246', 'SULAMERICA-2026',
   '*', '*', 100,
   'Identificação SulAmérica via ANS 006246',
   'SulAmérica Saúde requer ANS 006246 para validação de rede e contrato.',
   'RN 305/2012 ANS', 'Manual SulAmérica 2026 — Cap. 1',
   'critico', '["OPR-001"]'::jsonb, '["operator_ans_code"]'::jsonb, NULL, 28000, 91),

  ('CTR-SUL-002', '2026.1', '2026-01-01', NULL, '006246', 'SULAMERICA-2026',
   'guia_consulta', 'consulta', 80,
   'Data de atendimento obrigatória para consultas',
   'Consultas sem data de atendimento são rejeitadas no faturamento eletrônico SulAmérica.',
   'RN 305/2012 — Datas do atendimento', 'Contrato SulAmérica 2026 — Cláusula 5.2',
   'alto', '["DAT-001"]'::jsonb, '["attendance_date"]'::jsonb, NULL, 25000, 75),

  ('CTR-GEN-001', '2026.1', '2026-01-01', NULL, '*', 'GENERIC-ANS',
   '*', '*', 50,
   'Registro ANS obrigatório (regra genérica ANS)',
   'Toda guia TISS deve conter o registro ANS da operadora conforme padrão ANS/TISS.',
   'RN 305/2012 ANS — Identificação da operadora', 'Padrão TISS 4.01.00 — Grupo operadora',
   'critico', '["OPR-001"]'::jsonb, '["operator_ans_code"]'::jsonb, NULL, 20000, 85),

  ('CTR-GEN-002', '2026.1', '2026-01-01', NULL, '*', 'GENERIC-ANS',
   '*', '*', 40,
   'Nome do beneficiário obrigatório (regra genérica TISS)',
   'Identificação do beneficiário é campo obrigatório no padrão TISS.',
   'RN 305/2012 — Dados do beneficiário', 'Padrão TISS 4.01.00 — Grupo beneficiário',
   'critico', '["PAC-001"]'::jsonb, '["beneficiary_name"]'::jsonb, NULL, 20000, 80),

  ('CTR-GEN-003', '2026.1', '2026-01-01', NULL, '*', 'GENERIC-ANS',
   '*', '*', 30,
   'Código de procedimento TUSS obrigatório',
   'Procedimentos devem ser codificados conforme tabela TUSS vigente.',
   'RN 259/2011 ANS — Rol de procedimentos', 'Padrão TISS 4.01.00 — Grupo procedimentos',
   'critico', '["PRC-001"]'::jsonb, '["procedure_code"]'::jsonb, NULL, 35000, 88)
ON CONFLICT (rule_id, registry_version, contract) DO NOTHING;
