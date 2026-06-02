#!/usr/bin/env node
/**
 * MedFlow-IA — auditoria de existência física de tabelas via PostgREST (read-only).
 * Usa VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY de .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

const EXPECTED_TABLES = [
  "tenants", "profiles", "tenant_settings", "hospitals", "professionals",
  "units", "departments", "schedules", "shifts", "shift_assignments",
  "shift_swap_requests", "availability",
  "operational_events", "operational_recommendation_feedback",
  "operational_action_proposals", "operational_action_proposal_audit",
  "operational_execution_sandbox_runs", "operational_mutation_executions",
  "operational_orchestrations", "operational_orchestration_steps",
  "operational_agent_governance_sessions", "operational_agent_coordination_cycles",
  "operational_memory_entries",
  "operational_policy_intelligence_cycles", "operational_policy_governance_recommendations",
  "operational_policy_intelligence_audit",
  "operational_strategic_planning_cycles", "operational_strategic_planning_audit",
  "insurance_providers", "insurance_contracts", "insurance_rules", "tuss_procedures",
  "tiss_batches", "tiss_guides", "tiss_guide_items", "tiss_batch_exports",
  "tiss_returns", "tiss_denials", "tiss_denial_appeals", "tiss_denial_audit",
  "tiss_denial_financial_rollups", "tiss_denial_reason_rollups",
  "medical_production", "payout_rules", "medical_payouts", "medical_payout_items",
  "medical_payout_audit",
  "financial_closings", "financial_closing_snapshots", "financial_closing_audit",
  "operational_reconciliations", "operational_reconciliation_items",
  "operational_reconciliation_issues", "operational_reconciliation_audit",
  "operational_logs", "operational_errors", "operational_health_metrics",
  "pilot_feedback", "pilot_incidents", "pilot_suggestions",
  "pilot_feature_flags", "pilot_adoption_events",
];

const env = { ...process.env, ...loadEnv() };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

function classifyError(err) {
  const code = err?.code ?? "";
  const msg = (err?.message ?? "").toLowerCase();
  if (code === "PGRST205" || msg.includes("could not find") || msg.includes("does not exist")) {
    return "missing";
  }
  if (code === "42501" || msg.includes("permission denied") || msg.includes("row-level security")) {
    return "exists_rls";
  }
  if (err) return "error";
  return "ok";
}

const results = [];
for (const table of EXPECTED_TABLES) {
  const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
  const status = error ? classifyError(error) : "ok";
  results.push({ table, status, detail: error?.message ?? "reachable" });
}

const missing = results.filter((r) => r.status === "missing");
const exists = results.filter((r) => r.status !== "missing");
const rlsBlocked = results.filter((r) => r.status === "exists_rls");

console.log(JSON.stringify({
  audited_at: new Date().toISOString(),
  supabase_host: new URL(url).hostname,
  total: EXPECTED_TABLES.length,
  physical_or_reachable: exists.length,
  missing: missing.length,
  rls_protected: rlsBlocked.length,
  missing_tables: missing.map((r) => r.table),
  sample_reachable: results.filter((r) => r.status === "ok").slice(0, 5).map((r) => r.table),
}, null, 2));

if (missing.length > 0) process.exit(2);
