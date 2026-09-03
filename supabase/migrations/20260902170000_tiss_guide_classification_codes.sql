-- MedFlow-IA: códigos de classificação operacional + CNPJ do prestador — XML TISS (F3-S1 follow-up)
--
-- F3-S1 construiu o serializador real (mensagemTISS) mas deixou documentado
-- que regimeAtendimento/caraterAtendimento/tipoAtendimento/tipoConsulta não
-- tinham de onde vir no schema. Decisão de produto: guia carrega o valor
-- explícito quando varia caso a caso (tipo_atendimento, tipo_consulta);
-- tenant_settings carrega um default institucional só para os dois campos
-- que são quase sempre o mesmo valor pra cooperativa toda (regime, caráter)
-- — resolução em cadeia (guia > default do tenant > erro claro na
-- exportação) fica em tiss-classification-resolver.ts, não neste banco.
--
-- Nullable de propósito nos dois lugares: nenhum valor é inventado aqui;
-- guias/tenants existentes ficam sem valor até serem preenchidos, e a
-- exportação XML real bloqueia com erro claro quando a cadeia de resolução
-- não fecha — nunca usa placeholder.
--
-- CHECK constraints usam os mesmos enums do XSD oficial ANS 4.01.00
-- (dm_regimeAtendimento, dm_caraterAtendimento, dm_tipoAtendimento,
-- dm_tipoConsulta) conferidos em F3-S1 contra o schema real.

-- numeroGuiaPrestador (st_texto20, max 20 caracteres) não cabe o uuid de
-- tiss_guides.id (36 caracteres) — precisa de um número curto e sequencial,
-- que é exatamente o que "número da guia do prestador" significa no padrão
-- (não é o uuid interno). Sequência global simples (não por tenant): ainda
-- assim única e curta o bastante (cabe em st_texto20 com folga).
ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS guide_number bigint GENERATED ALWAYS AS IDENTITY;

ALTER TABLE public.tiss_guides
  ADD COLUMN IF NOT EXISTS regime_atendimento text,
  ADD COLUMN IF NOT EXISTS carater_atendimento text,
  ADD COLUMN IF NOT EXISTS tipo_atendimento text,
  ADD COLUMN IF NOT EXISTS tipo_consulta text;

ALTER TABLE public.tiss_guides
  ADD CONSTRAINT tiss_guides_regime_atendimento_chk
    CHECK (regime_atendimento IS NULL OR regime_atendimento IN ('01', '02', '03', '04', '05')),
  ADD CONSTRAINT tiss_guides_carater_atendimento_chk
    CHECK (carater_atendimento IS NULL OR carater_atendimento IN ('1', '2')),
  ADD CONSTRAINT tiss_guides_tipo_atendimento_chk
    CHECK (
      tipo_atendimento IS NULL
      OR tipo_atendimento IN ('01', '02', '03', '04', '08', '09', '10', '13', '23')
    ),
  ADD CONSTRAINT tiss_guides_tipo_consulta_chk
    CHECK (tipo_consulta IS NULL OR tipo_consulta IN ('1', '2', '3', '4'));

ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS default_regime_atendimento text,
  ADD COLUMN IF NOT EXISTS default_carater_atendimento text,
  ADD COLUMN IF NOT EXISTS cnpj text;

ALTER TABLE public.tenant_settings
  ADD CONSTRAINT tenant_settings_default_regime_atendimento_chk
    CHECK (default_regime_atendimento IS NULL OR default_regime_atendimento IN ('01', '02', '03', '04', '05')),
  ADD CONSTRAINT tenant_settings_default_carater_atendimento_chk
    CHECK (default_carater_atendimento IS NULL OR default_carater_atendimento IN ('1', '2'));

COMMENT ON COLUMN public.tenant_settings.cnpj IS
  'CNPJ da cooperativa/prestador — identifica quem envia o lote no XML TISS (mensagemTISS.cabecalho.origem.identificacaoPrestador). Sem CNPJ configurado, a exportação real bloqueia com erro claro.';
