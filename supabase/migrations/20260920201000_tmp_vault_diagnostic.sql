-- TEMPORÁRIO — diagnóstico da falha silenciosa em trigger_capture_pipeline_batch.
-- Não expõe o valor do segredo, só contagens/metadados. Remover depois de
-- diagnosticado.
create or replace function public.tmp_vault_diagnostic()
returns table (
  total_secrets bigint,
  matching_name bigint,
  sample_names text
)
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
begin
  return query
  select
    (select count(*) from vault.decrypted_secrets),
    (select count(*) from vault.decrypted_secrets where name = 'capture_pipeline_worker_secret'),
    (select string_agg(coalesce(name, '<null>'), ' | ') from vault.decrypted_secrets);
end;
$$;

revoke all on function public.tmp_vault_diagnostic() from public;
grant execute on function public.tmp_vault_diagnostic() to service_role;
