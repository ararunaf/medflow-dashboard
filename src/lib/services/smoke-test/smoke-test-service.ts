import { assertCan, can } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { validatePublicEnv } from "@/lib/env/public-env-validation";

export type SmokeTestId =
  | "login"
  | "dashboard"
  | "tiss"
  | "financial"
  | "reconciliation"
  | "onboarding";

export type SmokeTestResult = {
  id: SmokeTestId;
  label: string;
  passed: boolean;
  durationMs: number;
  detail: string;
};

export type SmokeTestReport = {
  generated_at: string;
  allPassed: boolean;
  results: SmokeTestResult[];
};

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  const value = await fn();
  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { ms: Math.round(end - start), value };
}

export async function runSmokeTests(ctx: ServiceCtx): Promise<SmokeTestReport> {
  assertCan(ctx.role, "tenant_settings:read");
  const results: SmokeTestResult[] = [];
  const env = validatePublicEnv();

  const login = await timed(async () => {
    const ok = !!ctx.userId && !!ctx.tenantId;
    return { ok, detail: ok ? "Sessão e tenant ativos." : "Sessão inválida." };
  });
  results.push({
    id: "login",
    label: "Login / sessão",
    passed: login.value.ok && env.supabaseConfigured,
    durationMs: login.ms,
    detail: login.value.detail,
  });

  const dashboard = await timed(async () => {
    const { error } = await ctx.client
      .from("profiles")
      .select("id")
      .eq("id", ctx.actorProfileId)
      .maybeSingle();
    if (error) {
      const mapped = mapPostgresError(error);
      return { ok: false, detail: mapped.message };
    }
    return { ok: true, detail: "Perfil e home acessíveis." };
  });
  results.push({
    id: "dashboard",
    label: "Dashboard / perfil",
    passed: dashboard.value.ok,
    durationMs: dashboard.ms,
    detail: dashboard.value.detail,
  });

  const canTiss = can(ctx.role, "tiss:read");
  if (canTiss) {
    const tiss = await timed(async () => {
      const { error } = await ctx.client.from("tiss_batches").select("id").limit(1);
      if (error) {
        const mapped = mapPostgresError(error);
        return { ok: false, detail: mapped.message };
      }
      return { ok: true, detail: "Leitura de lotes TISS OK." };
    });
    results.push({
      id: "tiss",
      label: "TISS (lotes / guias)",
      passed: tiss.value.ok,
      durationMs: tiss.ms,
      detail: tiss.value.detail,
    });
  } else {
    results.push({
      id: "tiss",
      label: "TISS (lotes / guias)",
      passed: true,
      durationMs: 0,
      detail: "Ignorado — papel sem permissão TISS.",
    });
  }

  const canFinance = can(ctx.role, "financial_closing:read");
  if (canFinance) {
    const financial = await timed(async () => {
      const { error } = await ctx.client.from("financial_closings").select("id").limit(1);
      if (error) {
        const mapped = mapPostgresError(error);
        return { ok: false, detail: mapped.message };
      }
      return { ok: true, detail: "Leitura de fechamentos OK." };
    });
    results.push({
      id: "financial",
      label: "Financeiro (fechamento)",
      passed: financial.value.ok,
      durationMs: financial.ms,
      detail: financial.value.detail,
    });

    const recon = await timed(async () => {
      const { error } = await ctx.client.from("operational_reconciliations").select("id").limit(1);
      if (error) {
        const mapped = mapPostgresError(error);
        return { ok: false, detail: mapped.message };
      }
      return { ok: true, detail: "Leitura de conciliações OK." };
    });
    results.push({
      id: "reconciliation",
      label: "Conciliação operacional",
      passed: recon.value.ok,
      durationMs: recon.ms,
      detail: recon.value.detail,
    });
  } else {
    results.push({
      id: "financial",
      label: "Financeiro (fechamento)",
      passed: true,
      durationMs: 0,
      detail: "Ignorado — papel sem permissão financeira.",
    });
    results.push({
      id: "reconciliation",
      label: "Conciliação operacional",
      passed: true,
      durationMs: 0,
      detail: "Ignorado — papel sem permissão financeira.",
    });
  }

  const onboarding = await timed(async () => {
    const { data, error } = await ctx.client
      .from("tenant_settings")
      .select("institution_name")
      .maybeSingle();
    if (error) {
      const mapped = mapPostgresError(error);
      return { ok: false, detail: mapped.message };
    }
    return {
      ok: true,
      detail: data?.institution_name
        ? `Onboarding: ${data.institution_name}`
        : "tenant_settings acessível — complete nome institucional.",
    };
  });
  results.push({
    id: "onboarding",
    label: "Onboarding institucional",
    passed: onboarding.value.ok,
    durationMs: onboarding.ms,
    detail: onboarding.value.detail,
  });

  const allPassed = results.every((r) => r.passed);
  return {
    generated_at: new Date().toISOString(),
    allPassed,
    results,
  };
}
