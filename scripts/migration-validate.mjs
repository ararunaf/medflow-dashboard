#!/usr/bin/env node
/**
 * Validação de migrations MedFlow-IA — arquivos locais + artefatos remotos (PostgREST).
 * Para schema_migrations, enums e policies completas: executar supabase/scripts/enterprise_schema_audit.sql
 * no SQL Editor com service role / psql.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const migrationsDir = join(root, "supabase/migrations");

const CRITICAL = [
  "20250512000000_init_enterprise.sql",
  "20250514120000_tenant_settings_branding_readiness.sql",
];

const EXPECTED_ENUMS = [
  "user_role", "unit_type", "schedule_status", "shift_status", "assignment_status",
  "swap_request_status", "operational_event_severity",
  "operational_recommendation_feedback_type",
  "operational_action_proposal_state", "operational_action_kind",
  "operational_action_proposal_audit_event", "operational_simulation_state",
  "operational_mutation_execution_state", "operational_orchestration_state",
  "operational_orchestration_step_kind", "operational_orchestration_step_state",
  "operational_memory_kind", "operational_memory_state",
  "operational_policy_governance_recommendation_kind",
  "supervised_policy_lifecycle_state",
  "operational_strategic_planning_lifecycle_state",
  "tiss_guide_type", "tiss_guide_status", "tiss_batch_status",
  "tiss_return_status", "tiss_denial_type", "tiss_denial_status", "tiss_appeal_status",
  "payout_rule_type", "medical_payout_status",
  "financial_closing_status", "financial_closing_snapshot_type",
  "operational_reconciliation_status", "operational_reconciliation_item_status",
  "operational_reconciliation_item_reference_type",
  "operational_reconciliation_issue_severity",
  "operational_reconciliation_audit_action",
];

function loadEnv() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function parseMigrationFiles() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const versions = files.map((f) => f.slice(0, 14));
  const duplicateVersions = versions.filter((v, i) => versions.indexOf(v) !== i);
  const uniqueDupes = [...new Set(duplicateVersions)];

  let orderOk = true;
  const orderIssues = [];
  for (let i = 1; i < files.length; i++) {
    if (files[i] <= files[i - 1]) {
      orderOk = false;
      orderIssues.push(`${files[i - 1]} >= ${files[i]}`);
    }
  }

  const enumDefs = new Map();
  const enumConflicts = [];
  const tables = new Map();
  const tablePolicies = new Map();
  const rlsIssues = [];

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), "utf8");

    for (const m of content.matchAll(
      /CREATE TYPE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)\s+AS ENUM\s*\(([\s\S]*?)\);/gi,
    )) {
      const name = m[1];
      const values = m[2]
        .split(",")
        .map((s) => s.trim().replace(/^'|'$/g, ""))
        .filter(Boolean);
      if (enumDefs.has(name)) {
        const prev = enumDefs.get(name);
        if (prev.values.join("|") !== values.join("|") || prev.file !== file) {
          enumConflicts.push({
            enum: name,
            first: prev,
            second: { file, values },
          });
        }
      } else {
        enumDefs.set(name, { file, values });
      }
    }

    for (const m of content.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi)) {
      const table = m[1];
      if (!tables.has(table)) tables.set(table, file);
    }

    for (const m of content.matchAll(/CREATE POLICY\s+(\w+)\s+ON\s+(?:public\.)?(\w+)/gi)) {
      const [, policy, table] = m;
      if (!tablePolicies.has(table)) tablePolicies.set(table, []);
      tablePolicies.get(table).push({ policy, file });
    }

    for (const table of [...content.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi)].map(
      (x) => x[1],
    )) {
      const hasRls =
        new RegExp(`ALTER TABLE\\s+(?:public\\.)?${table}\\s+ENABLE ROW LEVEL SECURITY`, "i").test(
          content,
        ) || new RegExp(`ENABLE ROW LEVEL SECURITY.*${table}`, "i").test(content);
      if (!hasRls) {
        rlsIssues.push({ file, table });
      }
    }
  }

  const enumsMissingFromManifest = EXPECTED_ENUMS.filter((e) => !enumDefs.has(e));
  const enumsExtra = [...enumDefs.keys()].filter((e) => !EXPECTED_ENUMS.includes(e));

  const tablesWithoutPolicy = [...tables.keys()].filter((t) => {
    if (t === "tenants") return false;
    return !tablePolicies.has(t) || tablePolicies.get(t).length === 0;
  });

  return {
    files,
    count: files.length,
    orderOk,
    orderIssues,
    duplicateVersions: uniqueDupes,
    enumDefs: Object.fromEntries(enumDefs),
    enumConflicts,
    enumsMissingFromManifest,
    enumsExtra,
    tables: Object.fromEntries(tables),
    tablesWithoutPolicy,
    rlsIssues,
    tablePolicyCount: Object.fromEntries(
      [...tablePolicies.entries()].map(([k, v]) => [k, v.length]),
    ),
  };
}

function analyzeCritical(local) {
  const init = readFileSync(join(migrationsDir, CRITICAL[0]), "utf8");
  const branding = readFileSync(join(migrationsDir, CRITICAL[1]), "utf8");

  const initArtifacts = {
    tables: ["tenants", "profiles", "hospitals", "professionals"].every((t) =>
      /CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?/.test(init) &&
      init.includes(`public.${t}`),
    ),
    user_role_enum: /CREATE TYPE public\.user_role AS ENUM/i.test(init),
    current_tenant_ids: /CREATE OR REPLACE FUNCTION public\.current_tenant_ids/i.test(init),
    rls_on_core: ["tenants", "profiles", "hospitals", "professionals"].every((t) =>
      new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`, "i").test(init),
    ),
  };

  const brandingArtifacts = {
    tenant_settings_table: /CREATE TABLE IF NOT EXISTS public\.tenant_settings/i.test(branding),
    is_tenant_admin_dependency: branding.includes("is_tenant_admin()"),
    rbac_migration_before:
      local.files.indexOf(CRITICAL[1]) >
      local.files.indexOf("20250512000002_operational_rbac_state.sql"),
    storage_bucket: /tenant-branding/.test(branding),
    storage_policies: (branding.match(/CREATE POLICY tenant_branding_/g) ?? []).length >= 4,
    backfill_settings: /INSERT INTO public\.tenant_settings/i.test(branding),
  };

  return { initArtifacts, brandingArtifacts };
}

async function probeRemote(env) {
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { skipped: true, reason: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes" };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const host = new URL(url).hostname;

  const criticalTables = [
    "tenants", "profiles", "tenant_settings", "hospitals", "professionals",
    "insurance_providers", "insurance_contracts",
  ];

  const tableStatus = {};
  for (const table of criticalTables) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
    const msg = (error?.message ?? "").toLowerCase();
    tableStatus[table] = error
      ? msg.includes("does not exist") || error.code === "PGRST205"
        ? "missing"
        : "exists"
      : "reachable";
  }

  const { data: tenants, error: tenantErr } = await supabase
    .from("tenants")
    .select("slug")
    .in("slug", [
      "hospital-saojose",
      "cooperativa-med",
      "grupo-vida",
      "medflow-v1-demo",
      "medflow-admin",
    ]);

  const { count: settingsCount, error: settingsErr } = await supabase
    .from("tenant_settings")
    .select("*", { head: true, count: "exact" });

  let storageBucket = "unknown";
  try {
    const { data, error } = await supabase.storage.from("tenant-branding").list("", { limit: 1 });
    storageBucket = error ? `error: ${error.message}` : data !== null ? "exists" : "missing";
  } catch (e) {
    storageBucket = `error: ${e.message}`;
  }

  const initApplied =
    tableStatus.tenants !== "missing" &&
    tableStatus.profiles !== "missing" &&
    tableStatus.hospitals !== "missing" &&
    tableStatus.professionals !== "missing";

  const brandingApplied =
    tableStatus.tenant_settings !== "missing" &&
    !String(storageBucket).startsWith("error") &&
    storageBucket === "exists";

  return {
    skipped: false,
    host,
    tableStatus,
    initApplied,
    brandingApplied,
    demo_tenant_slugs: tenants?.map((t) => t.slug) ?? [],
    tenant_query_error: tenantErr?.message ?? null,
    tenant_settings_count_anon: settingsCount,
    tenant_settings_error: settingsErr?.message ?? null,
    storage_bucket: storageBucket,
  };
}

const local = parseMigrationFiles();
const critical = analyzeCritical(local);
const remote = await probeRemote({ ...process.env, ...loadEnv() });

const report = {
  validated_at: new Date().toISOString(),
  local: {
    migration_count: local.count,
    order_ok: local.orderOk,
    duplicate_versions: local.duplicateVersions,
    enum_conflicts: local.enumConflicts,
    enums_in_files: Object.keys(local.enumDefs).length,
    enums_expected: EXPECTED_ENUMS.length,
    enums_missing_in_files: local.enumsMissingFromManifest,
    enums_extra_in_files: local.enumsExtra,
    tables_defined: Object.keys(local.tables).length,
    tables_without_policy_in_sql: local.tablesWithoutPolicy,
    rls_static_issues: local.rlsIssues,
    critical,
  },
  remote,
  limits: {
    schema_migrations: "Requer DATABASE_URL ou SQL Editor — tabela supabase_migrations.schema_migrations",
    enum_values_remote: "Requer enterprise_schema_audit.sql seção 6",
    policies_remote: "Requer enterprise_schema_audit.sql seção 3",
  },
};

console.log(JSON.stringify(report, null, 2));

let exitCode = 0;
if (!local.orderOk || local.duplicateVersions.length) exitCode = 1;
if (local.enumConflicts.length) exitCode = 1;
if (local.enumsMissingFromManifest.length) exitCode = 1;
if (local.rlsIssues.length) exitCode = 1;
if (!remote.skipped) {
  if (!remote.initApplied || !remote.brandingApplied) exitCode = 1;
}

process.exit(exitCode);
