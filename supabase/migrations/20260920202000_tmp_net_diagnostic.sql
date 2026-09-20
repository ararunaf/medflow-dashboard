-- TEMPORÁRIO — diagnóstico da fila/respostas do pg_net, para confirmar se
-- net.http_post está sendo de fato enfileirado/entregue. Remover depois de
-- diagnosticado.
create or replace function public.tmp_net_diagnostic()
returns table (
  recent_requests jsonb
)
language plpgsql
security definer
set search_path = public, extensions, net
as $$
begin
  return query
  select coalesce(
    (
      select jsonb_agg(to_jsonb(r) order by r.id desc)
      from (
        select id, method, url, created
        from net.http_request_queue
        order by id desc
        limit 5
      ) r
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.tmp_net_diagnostic() from public;
grant execute on function public.tmp_net_diagnostic() to service_role;

create or replace function public.tmp_net_response_diagnostic()
returns table (
  recent_responses jsonb
)
language plpgsql
security definer
set search_path = public, extensions, net
as $$
begin
  return query
  select coalesce(
    (
      select jsonb_agg(to_jsonb(r) order by r.id desc)
      from (
        select id, status_code, created, error_msg,
          left(content, 200) as content_preview
        from net._http_response
        order by id desc
        limit 5
      ) r
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.tmp_net_response_diagnostic() from public;
grant execute on function public.tmp_net_response_diagnostic() to service_role;
