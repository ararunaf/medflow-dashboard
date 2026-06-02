-- MedFlow-IA — Auditoria enterprise de schema (read-only)
-- Executar no Supabase SQL Editor ou via psql (service role recomendado).
-- Não altera dados nem estrutura.

\set ON_ERROR_STOP off

-- ---------------------------------------------------------------------------
-- 1. Inventário físico de tabelas esperadas (62 public)
-- ---------------------------------------------------------------------------
WITH expected AS (
  SELECT unnest(ARRAY[
    'tenants','profiles','tenant_settings','hospitals','professionals',
    'units','departments','schedules','shifts','shift_assignments',
    'shift_swap_requests','availability',
    'operational_events','operational_recommendation_feedback',
    'operational_action_proposals','operational_action_proposal_audit',
    'operational_execution_sandbox_runs','operational_mutation_executions',
    'operational_orchestrations','operational_orchestration_steps',
    'operational_agent_governance_sessions','operational_agent_coordination_cycles',
    'operational_memory_entries',
    'operational_policy_intelligence_cycles','operational_policy_governance_recommendations',
    'operational_policy_intelligence_audit',
    'operational_strategic_planning_cycles','operational_strategic_planning_audit',
    'insurance_providers','insurance_contracts','insurance_rules','tuss_procedures',
    'tiss_batches','tiss_guides','tiss_guide_items','tiss_batch_exports',
    'tiss_returns','tiss_denials','tiss_denial_appeals','tiss_denial_audit',
    'tiss_denial_financial_rollups','tiss_denial_reason_rollups',
    'medical_production','payout_rules','medical_payouts','medical_payout_items',
    'medical_payout_audit',
    'financial_closings','financial_closing_snapshots','financial_closing_audit',
    'operational_reconciliations','operational_reconciliation_items',
    'operational_reconciliation_issues','operational_reconciliation_audit',
    'operational_logs','operational_errors','operational_health_metrics',
    'pilot_feedback','pilot_incidents','pilot_suggestions',
    'pilot_feature_flags','pilot_adoption_events'
  ]::text[]) AS table_name
),
physical AS (
  SELECT c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
)
SELECT
  e.table_name,
  CASE WHEN p.table_name IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS physical_status
FROM expected e
LEFT JOIN physical p ON p.table_name = e.table_name
ORDER BY physical_status DESC, e.table_name;

-- ---------------------------------------------------------------------------
-- 2. Tabelas extras no banco (não listadas no manifesto)
-- ---------------------------------------------------------------------------
WITH expected AS (
  SELECT unnest(ARRAY[
    'tenants','profiles','tenant_settings','hospitals','professionals',
    'units','departments','schedules','shifts','shift_assignments',
    'shift_swap_requests','availability',
    'operational_events','operational_recommendation_feedback',
    'operational_action_proposals','operational_action_proposal_audit',
    'operational_execution_sandbox_runs','operational_mutation_executions',
    'operational_orchestrations','operational_orchestration_steps',
    'operational_agent_governance_sessions','operational_agent_coordination_cycles',
    'operational_memory_entries',
    'operational_policy_intelligence_cycles','operational_policy_governance_recommendations',
    'operational_policy_intelligence_audit',
    'operational_strategic_planning_cycles','operational_strategic_planning_audit',
    'insurance_providers','insurance_contracts','insurance_rules','tuss_procedures',
    'tiss_batches','tiss_guides','tiss_guide_items','tiss_batch_exports',
    'tiss_returns','tiss_denials','tiss_denial_appeals','tiss_denial_audit',
    'tiss_denial_financial_rollups','tiss_denial_reason_rollups',
    'medical_production','payout_rules','medical_payouts','medical_payout_items',
    'medical_payout_audit',
    'financial_closings','financial_closing_snapshots','financial_closing_audit',
    'operational_reconciliations','operational_reconciliation_items',
    'operational_reconciliation_issues','operational_reconciliation_audit',
    'operational_logs','operational_errors','operational_health_metrics',
    'pilot_feedback','pilot_incidents','pilot_suggestions',
    'pilot_feature_flags','pilot_adoption_events'
  ]::text[]) AS table_name
)
SELECT c.relname AS unexpected_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT IN (SELECT table_name FROM expected)
ORDER BY c.relname;

-- ---------------------------------------------------------------------------
-- 3. RLS habilitado em todas as tabelas de negócio
-- ---------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'FAIL' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, c.relname;

-- ---------------------------------------------------------------------------
-- 4. Coluna tenant_id (direta ou via FK encadeada documentada)
-- ---------------------------------------------------------------------------
WITH tenant_direct AS (
  SELECT table_name
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'tenant_id'
),
tenant_via_parent AS (
  SELECT unnest(ARRAY[
    'financial_closing_snapshots',
    'medical_payout_items',
    'operational_orchestration_steps',
    'tiss_guide_items',
    'tiss_denial_financial_rollups',
    'tiss_denial_reason_rollups'
  ]::text[]) AS table_name
),
tenant_exempt AS (
  SELECT unnest(ARRAY['tenants', 'tuss_procedures']::text[]) AS table_name
),
all_public AS (
  SELECT c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
)
SELECT
  a.table_name,
  CASE
    WHEN td.table_name IS NOT NULL THEN 'tenant_id direct'
    WHEN tv.table_name IS NOT NULL THEN 'tenant via parent FK'
    WHEN te.table_name IS NOT NULL THEN 'exempt (root/global)'
    ELSE 'REVIEW'
  END AS tenant_isolation
FROM all_public a
LEFT JOIN tenant_direct td ON td.table_name = a.table_name
LEFT JOIN tenant_via_parent tv ON tv.table_name = a.table_name
LEFT JOIN tenant_exempt te ON te.table_name = a.table_name
ORDER BY tenant_isolation DESC, a.table_name;

-- ---------------------------------------------------------------------------
-- 5. Integridade tenants ↔ tenant_settings ↔ profiles
-- ---------------------------------------------------------------------------
SELECT 'tenants_without_settings' AS check_name, count(*) AS issue_count
FROM public.tenants t
LEFT JOIN public.tenant_settings ts ON ts.tenant_id = t.id
WHERE ts.tenant_id IS NULL
UNION ALL
SELECT 'orphan_profiles', count(*)
FROM public.profiles p
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE t.id IS NULL
UNION ALL
SELECT 'profiles_without_auth_user', count(*)
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL
UNION ALL
SELECT 'settings_without_tenant', count(*)
FROM public.tenant_settings ts
LEFT JOIN public.tenants t ON t.id = ts.tenant_id
WHERE t.id IS NULL;

-- ---------------------------------------------------------------------------
-- 6. Enums esperados (37)
-- ---------------------------------------------------------------------------
WITH expected_enums AS (
  SELECT unnest(ARRAY[
    'user_role','unit_type','schedule_status','shift_status','assignment_status',
    'swap_request_status','operational_event_severity',
    'operational_recommendation_feedback_type',
    'operational_action_proposal_state','operational_action_kind',
    'operational_action_proposal_audit_event','operational_simulation_state',
    'operational_mutation_execution_state','operational_orchestration_state',
    'operational_orchestration_step_kind','operational_orchestration_step_state',
    'operational_memory_kind','operational_memory_state',
    'operational_policy_governance_recommendation_kind',
    'supervised_policy_lifecycle_state',
    'operational_strategic_planning_lifecycle_state',
    'tiss_guide_type','tiss_guide_status','tiss_batch_status',
    'tiss_return_status','tiss_denial_type','tiss_denial_status','tiss_appeal_status',
    'payout_rule_type','medical_payout_status',
    'financial_closing_status','financial_closing_snapshot_type',
    'operational_reconciliation_status','operational_reconciliation_item_status',
    'operational_reconciliation_item_reference_type',
    'operational_reconciliation_issue_severity',
    'operational_reconciliation_audit_action'
  ]::text[]) AS enum_name
)
SELECT
  e.enum_name,
  CASE WHEN t.typname IS NOT NULL THEN 'OK' ELSE 'MISSING' END AS status
FROM expected_enums e
LEFT JOIN pg_type t ON t.typname = e.enum_name AND t.typnamespace = 'public'::regnamespace
ORDER BY status DESC, e.enum_name;

-- ---------------------------------------------------------------------------
-- 7. Foreign keys ausentes ou inválidas (orphan check amostral)
-- ---------------------------------------------------------------------------
SELECT 'professionals_orphan_profile' AS check_name, count(*) AS orphans
FROM public.professionals pr
LEFT JOIN public.profiles p ON p.id = pr.profile_id
WHERE p.id IS NULL
UNION ALL
SELECT 'professionals_tenant_mismatch', count(*)
FROM public.professionals pr
JOIN public.profiles p ON p.id = pr.profile_id
WHERE pr.tenant_id <> p.tenant_id
UNION ALL
SELECT 'tiss_guides_orphan_provider', count(*)
FROM public.tiss_guides g
LEFT JOIN public.insurance_providers ip
  ON ip.tenant_id = g.tenant_id AND ip.id = g.insurance_provider_id
WHERE ip.id IS NULL;

-- ---------------------------------------------------------------------------
-- 8. Índices tenant_id (performance multi-tenant)
-- ---------------------------------------------------------------------------
SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  pg_get_indexdef(i.oid) AS index_def
FROM pg_class t
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_index ix ON ix.indrelid = t.oid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE n.nspname = 'public'
  AND pg_get_indexdef(i.oid) ILIKE '%tenant_id%'
ORDER BY t.relname, i.relname;

-- ---------------------------------------------------------------------------
-- 9. Soft delete — confirmar ausência (design atual: hard delete + audit tables)
-- ---------------------------------------------------------------------------
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('deleted_at', 'is_deleted', 'archived_at')
ORDER BY table_name;

-- ---------------------------------------------------------------------------
-- 10. Timestamps (created_at / updated_at)
-- ---------------------------------------------------------------------------
SELECT
  c.table_name,
  bool_or(c.column_name = 'created_at') AS has_created_at,
  bool_or(c.column_name = 'updated_at') AS has_updated_at
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name IN ('created_at', 'updated_at')
GROUP BY c.table_name
ORDER BY c.table_name;

-- ---------------------------------------------------------------------------
-- 11. Funções RLS críticas
-- ---------------------------------------------------------------------------
SELECT
  p.proname AS function_name,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'current_tenant_ids','current_user_role','current_professional_id',
    'is_operational_manager','is_tenant_admin','can_manage_billing','can_manage_tuss_catalog'
  )
ORDER BY p.proname;

-- ---------------------------------------------------------------------------
-- 12. Storage bucket tenant-branding
-- ---------------------------------------------------------------------------
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'tenant-branding';
