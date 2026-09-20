-- Remove as funções de diagnóstico temporário criadas para investigar a
-- falha silenciosa em trigger_capture_pipeline_batch (causa real: endpoint_url
-- desatualizado em capture_pipeline_worker_config, não o Vault/pg_net).
drop function if exists public.tmp_vault_diagnostic();
drop function if exists public.tmp_net_diagnostic();
drop function if exists public.tmp_net_response_diagnostic();
