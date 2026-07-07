-- MedFlow-IA — Capture Foundation Health Check (read-only)
-- Sprint: MEDICFLOW-INTELLIGENT-CAPTURE-02A
-- Migration: 20260703120000_intelligent_capture_foundation.sql
-- Executar via: supabase db query --linked -f supabase/scripts/capture_healthcheck.sql
-- Ou no SQL Editor com service role.

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Resumo executivo — artefatos da Captura Inteligente
-- ---------------------------------------------------------------------------
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'capture_sessions',
    'capture_documents',
    'capture_pages',
    'capture_fields',
    'capture_findings',
    'capture_corrections',
    'capture_templates'
  ]) AS tablename
),
table_counts AS (
  SELECT count(*) AS capture_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (SELECT tablename FROM expected_tables)
),
enum_counts AS (
  SELECT count(*) AS capture_enums
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typtype = 'e'
    AND t.typname IN (
      'capture_session_status',
      'capture_channel',
      'capture_finding_severity',
      'capture_finding_status'
    )
),
policy_counts AS (
  SELECT
    count(*) FILTER (WHERE schemaname = 'public' AND policyname LIKE 'capture_%') AS capture_table_policies,
    count(*) FILTER (WHERE schemaname = 'storage' AND policyname LIKE 'clinical_documents_%') AS storage_policies
  FROM pg_policies
),
trigger_counts AS (
  SELECT count(*) AS capture_triggers
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
    AND t.tgname LIKE 'capture_%updated_at'
),
fk_counts AS (
  SELECT count(*) AS capture_fks
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND con.contype = 'f'
    AND c.relname LIKE 'capture_%'
),
index_counts AS (
  SELECT count(*) AS capture_indexes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'i'
    AND c.relname LIKE 'capture_%'
),
rls_counts AS (
  SELECT
    count(*) AS capture_tables_with_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (SELECT tablename FROM expected_tables)
    AND c.relrowsecurity
),
bucket_counts AS (
  SELECT count(*) AS clinical_documents_bucket
  FROM storage.buckets
  WHERE id = 'clinical-documents'
),
migration_applied AS (
  SELECT count(*) AS capture_migration
  FROM supabase_migrations.schema_migrations
  WHERE version = '20260703120000'
)
SELECT
  'CAPTURE_HEALTHCHECK_SUMMARY' AS section,
  (SELECT capture_tables FROM table_counts) AS capture_tables,
  (SELECT capture_tables FROM table_counts) = 7 AS capture_tables_ok,
  (SELECT capture_enums FROM enum_counts) AS capture_enums,
  (SELECT capture_enums FROM enum_counts) = 4 AS capture_enums_ok,
  (SELECT capture_table_policies FROM policy_counts) AS capture_table_policies,
  (SELECT capture_table_policies FROM policy_counts) = 20 AS capture_table_policies_ok,
  (SELECT storage_policies FROM policy_counts) AS storage_policies,
  (SELECT storage_policies FROM policy_counts) = 4 AS storage_policies_ok,
  (SELECT capture_triggers FROM trigger_counts) AS capture_triggers,
  (SELECT capture_triggers FROM trigger_counts) = 6 AS capture_triggers_ok,
  (SELECT capture_fks FROM fk_counts) AS capture_foreign_keys,
  (SELECT capture_fks FROM fk_counts) >= 12 AS capture_foreign_keys_ok,
  (SELECT capture_indexes FROM index_counts) AS capture_indexes,
  (SELECT capture_indexes FROM index_counts) >= 12 AS capture_indexes_ok,
  (SELECT capture_tables_with_rls FROM rls_counts) AS capture_rls_tables,
  (SELECT capture_tables_with_rls FROM rls_counts) = 7 AS capture_rls_ok,
  (SELECT clinical_documents_bucket FROM bucket_counts) AS clinical_documents_bucket,
  (SELECT clinical_documents_bucket FROM bucket_counts) = 1 AS clinical_documents_bucket_ok,
  (SELECT capture_migration FROM migration_applied) AS capture_migration_applied,
  (SELECT capture_migration FROM migration_applied) = 1 AS capture_migration_ok;

-- Tabelas capture_*
SELECT 'CAPTURE_TABLES' AS section, c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'capture_%'
ORDER BY c.relname;

-- Enums capture_*
SELECT 'CAPTURE_ENUMS' AS section, t.typname AS enum_name
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
  AND t.typname LIKE 'capture_%'
ORDER BY t.typname;

-- Policies capture + storage clinical-documents
SELECT 'CAPTURE_POLICIES' AS section, schemaname, tablename, policyname
FROM pg_policies
WHERE (schemaname = 'public' AND policyname LIKE 'capture_%')
   OR (schemaname = 'storage' AND policyname LIKE 'clinical_documents_%')
ORDER BY schemaname, tablename, policyname;

-- Triggers updated_at
SELECT 'CAPTURE_TRIGGERS' AS section, c.relname AS table_name, t.tgname AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname LIKE 'capture_%'
ORDER BY c.relname;

-- Bucket clinical-documents
SELECT 'CAPTURE_STORAGE' AS section, id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'clinical-documents';
