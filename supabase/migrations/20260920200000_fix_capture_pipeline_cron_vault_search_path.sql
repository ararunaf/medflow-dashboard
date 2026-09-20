-- F1-S4-DEPLOY — corrige trigger_capture_pipeline_batch: o search_path
-- restrito a (public, extensions) fazia a consulta a
-- vault.decrypted_secrets voltar sem linhas silenciosamente (sem erro),
-- mesmo com o segredo existindo no Vault com o nome certo — confirmado em
-- produção: chamar a função direto via RPC não lançava erro, mas o job de
-- teste nunca era processado, e o aviso 'ausente no Vault' era a única
-- explicação consistente com esse comportamento.
--
-- Adiciona vault ao search_path da função (mantendo public/extensions).

create or replace function public.trigger_capture_pipeline_batch()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_config public.capture_pipeline_worker_config;
  v_secret text;
begin
  select * into v_config from public.capture_pipeline_worker_config where id = true;
  if v_config is null or not v_config.enabled or v_config.endpoint_url is null then
    return;
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'capture_pipeline_worker_secret'
  limit 1;

  if v_secret is null then
    raise warning 'capture_pipeline_worker_secret ausente no Vault — cron não disparado.';
    return;
  end if;

  perform net.http_post(
    url := v_config.endpoint_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-capture-worker-secret', v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
end;
$$;

revoke all on function public.trigger_capture_pipeline_batch() from public;
