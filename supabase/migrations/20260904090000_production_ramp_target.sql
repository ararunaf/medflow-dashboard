-- F6-O2: meta de rampa de produção (10%/50%/100% do volume mensal pleno da
-- cooperativa) por tenant. A rampa em si (decisão de negócio de quando subir
-- o volume real processado) é institucional; o que fica aqui é o alvo atual
-- escolhido, usado para calcular o progresso real (guias/faturamento do mês
-- vs. meta) no painel de acompanhamento.
ALTER TABLE public.tenant_settings
  ADD COLUMN IF NOT EXISTS production_ramp_target_pct integer NOT NULL DEFAULT 10;

ALTER TABLE public.tenant_settings
  DROP CONSTRAINT IF EXISTS tenant_settings_production_ramp_target_pct_chk;
ALTER TABLE public.tenant_settings
  ADD CONSTRAINT tenant_settings_production_ramp_target_pct_chk
  CHECK (production_ramp_target_pct IN (10, 50, 100));
