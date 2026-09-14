-- F1-S4-DEPLOY — aciona o pipeline de captura via pg_cron, sem depender de
-- um processo worker always-on.
--
-- Antes: só havia `scripts/capture/worker/capture-pipeline-worker.ts`, um
-- script que precisa ficar rodando manualmente. `claim_capture_pipeline_job`
-- (SKIP LOCKED) já suporta N workers concorrentes com segurança — faltava
-- quem os mantivesse vivos 24x7. Esta migração fecha essa lacuna sem
-- contratar infraestrutura nova: usa pg_cron + pg_net (já disponíveis no
-- projeto Supabase) para chamar, a cada minuto, o endpoint
-- `/api/capture/process-batch` (ver `src/routes/api.capture.process-batch.ts`),
-- que drena a fila por um orçamento curto de tempo com várias lanes
-- concorrentes — sem processo persistente para supervisionar.
--
-- Fica DESLIGADO por padrão (enabled = false) até alguém preencher a URL
-- real do deploy e o segredo compartilhado — ver instruções ao final deste
-- arquivo. O segredo NUNCA é commitado em texto plano: fica no Supabase
-- Vault, lido em tempo de execução pela função abaixo.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.capture_pipeline_worker_config (
  id boolean primary key default true,
  endpoint_url text,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint capture_pipeline_worker_config_singleton check (id)
);

insert into public.capture_pipeline_worker_config (id, endpoint_url, enabled)
values (true, null, false)
on conflict (id) do nothing;

alter table public.capture_pipeline_worker_config enable row level security;

-- Config operacional de sistema — nenhum client autenticado lê/escreve;
-- só service_role (migrações/dashboard) e a função SECURITY DEFINER abaixo.
drop policy if exists capture_pipeline_worker_config_no_client_access
  on public.capture_pipeline_worker_config;
create policy capture_pipeline_worker_config_no_client_access
  on public.capture_pipeline_worker_config
  for all to authenticated
  using (false);

-- ---------------------------------------------------------------------------
-- trigger_capture_pipeline_batch — chamada pelo cron a cada minuto. No-op
-- enquanto `enabled = false` ou `endpoint_url` não estiver preenchido (não
-- desperdiça requisição nem falha alto quando ainda não foi configurado).
-- O segredo é lido do Vault (nome fixo 'capture_pipeline_worker_secret') —
-- nunca fica no corpo desta função nem em texto plano em nenhuma migração.
-- ---------------------------------------------------------------------------
create or replace function public.trigger_capture_pipeline_batch()
returns void
language plpgsql
security definer
set search_path = public, extensions
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

select cron.unschedule('capture-pipeline-worker-batch')
where exists (select 1 from cron.job where jobname = 'capture-pipeline-worker-batch');

select cron.schedule(
  'capture-pipeline-worker-batch',
  '* * * * *',
  $$select public.trigger_capture_pipeline_batch();$$
);

comment on table public.capture_pipeline_worker_config is
  'Config de sistema do cron do pipeline de captura (F1-S4-DEPLOY). Para ativar:
  1) select vault.create_secret(''<o-mesmo-valor-do-env-CAPTURE_PIPELINE_WORKER_SECRET-no-deploy>'', ''capture_pipeline_worker_secret'');
  2) update public.capture_pipeline_worker_config set endpoint_url = ''https://<seu-domínio>/api/capture/process-batch'', enabled = true, updated_at = now() where id = true;
  Rodar via SQL editor do Supabase — nunca commitar o segredo em migração.';
