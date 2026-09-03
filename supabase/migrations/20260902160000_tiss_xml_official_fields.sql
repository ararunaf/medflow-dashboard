-- MedFlow-IA: campos reais exigidos pelo XML TISS oficial (F3-S1)
--
-- Ao investigar o XSD oficial da ANS (padrão TISS 4.01.00, mensagemTISS >
-- prestadorParaOperadora > loteGuias > guiaConsulta/guiaSP-SADT/
-- guiaHonorarios), descobrimos que o schema do MedFlow nunca capturou três
-- campos exigidos em toda guia real:
--   1. número da carteirinha do beneficiário (ct_beneficiarioDados.numeroCarteira)
--   2. CNES do estabelecimento executante (dadosExecutante.CNES)
--   3. CBOS do profissional executante (ct_contratadoProfissionalDados.CBOS —
--      classificação brasileira de ocupações; dm_CBOS é um enum fechado de
--      ~200 códigos por especialidade médica, não dá para mapear
--      automaticamente a partir de professionals.specialty (texto livre)
--      sem risco real de errar a classificação — precisa ser cadastrado)
-- Sem os três, nenhum XML TISS gerado é válido — não são campos opcionais
-- no padrão.
--
-- Adicionados como nullable de propósito: registros já existentes ficam
-- sem eles até serem completados; a exportação XML real
-- (xml-export-service) exige os três preenchidos e falha com erro de
-- validação claro quando ausentes — nunca inventa ou usa placeholder.

ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS beneficiary_card_number text,
  ADD COLUMN IF NOT EXISTS beneficiary_is_newborn boolean NOT NULL DEFAULT false;

ALTER TABLE public.hospitals
  ADD COLUMN IF NOT EXISTS cnes text;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS cbo_code text;
