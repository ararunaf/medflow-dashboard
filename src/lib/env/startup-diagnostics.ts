import { runStartupChecks, type StartupCheckResult, getInstitutionalDomain } from "@/lib/env/startup-checks";
import { isStagingBuildMode, STAGING_APP_URL } from "@/lib/env/medflow-domains";

export type StartupDiagnosticScope = "server" | "client";

function envModeLabel(): string {
  if (typeof import.meta === "undefined") return "node";
  if (import.meta.env.DEV) return "desenvolvimento";
  if (isStagingBuildMode()) return "staging";
  if (import.meta.env.PROD) return "produção";
  return "desconhecido";
}

export function formatStartupDiagnostics(
  result: StartupCheckResult,
  scope: StartupDiagnosticScope,
): string[] {
  const lines = [
    `[MedFlow] readiness (${scope}, ${envModeLabel()})`,
    result.ok ? "  ✓ Ambiente crítico OK" : "  ✗ Pendências de ambiente",
  ];

  for (const check of result.checks) {
    const mark = check.ok ? "✓" : "✗";
    lines.push(`  ${mark} ${check.label}: ${check.detail}`);
  }

  if (result.publicEnv.warnings.length) {
    lines.push(`  ! ${result.publicEnv.warnings.join(" · ")}`);
  }

  if (!result.publicEnv.supabaseConfigured) {
    lines.push(
      "  → Copie .env.example para .env ou .env.local e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    );
  } else if (import.meta.env.DEV) {
    lines.push("  → Supabase configurado. Login: http://localhost:8080/login");
  } else {
    const base = getInstitutionalDomain() ?? (isStagingBuildMode() ? STAGING_APP_URL : undefined);
    if (base) {
      const login = base.endsWith("/") ? `${base}login` : `${base}/login`;
      lines.push(`  → Supabase configurado. Login: ${login}`);
    }
  }

  return lines;
}

const loggedScopes = new Set<StartupDiagnosticScope>();

/** Logs de boot — uma vez por escopo (SSR + cliente em dev). */
export function logStartupDiagnostics(scope: StartupDiagnosticScope): void {
  if (typeof import.meta !== "undefined" && import.meta.env.PROD && scope === "client") {
    return;
  }
  if (loggedScopes.has(scope)) return;
  loggedScopes.add(scope);

  const result = runStartupChecks();
  const lines = formatStartupDiagnostics(result, scope);
  const message = lines.join("\n");

  if (result.ok) {
    console.info(message);
  } else {
    console.warn(message);
  }
}
