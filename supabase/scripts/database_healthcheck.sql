-- MedFlow-IA — Database Health Check (read-only)
-- Sprint: MEDICFLOW-REBUILD-01
-- Executar via: supabase db execute --linked --file supabase/scripts/database_healthcheck.sql
-- Ou no SQL Editor com service role.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Resumo executivo (contagens esperadas pós-rebuild)
-- ---------------------------------------------------------------------------
WITH counts AS (
  SELECT
    (SELECT count(*) FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
     WHERE e.extname IN ('vector', 'pgcrypto')) AS extensions_ok,
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r') AS table_count,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS policy_count,
    (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage') AS storage_policy_count,
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prokind = 'f') AS rpc_count,
    (SELECT count(*) FROM pg_trigger t
     JOIN pg_class c ON c.oid = t.tgrelid
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND NOT t.tgisinternal) AS trigger_count,
    (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public' AND t.typtype = 'e') AS enum_count,
    (SELECT count(*) FROM storage.buckets WHERE id = 'tenant-branding') AS bucket_count,
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'match_knowledge_embeddings') AS match_fn_count,
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity) AS rls_enabled_tables,
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r') AS total_public_tables,
    (SELECT count(*) FROM supabase_migrations.schema_migrations) AS migration_count
)
SELECT
  'HEALTHCHECK_SUMMARY' AS section,
  extensions_ok = 2 AS pgvector_pgcrypto_ok,
  table_count AS tables,
  table_count = 65 AS tables_ok,
  policy_count + storage_policy_count AS policies_total,
  (policy_count + storage_policy_count) = 166 AS policies_ok,
  rpc_count AS rpcs,
  rpc_count = 33 AS rpcs_ok,
  trigger_count AS triggers,
  trigger_count = 21 AS triggers_ok,
  enum_count AS enums,
  enum_count = 37 AS enums_ok,
  bucket_count = 1 AS tenant_branding_ok,
  match_fn_count = 1 AS match_knowledge_embeddings_ok,
  rls_enabled_tables = total_public_tables AS rls_all_tables_ok,
  migration_count AS migrations_applied,
  migration_count = 29 AS migrations_ok
FROM counts;

-- Extensões individuais
SELECT 'EXTENSIONS' AS section, extname, extversion
FROM pg_extension
WHERE extname IN ('vector', 'pgcrypto')
ORDER BY extname;

-- Migrations aplicadas
SELECT 'MIGRATIONS' AS section, version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;
