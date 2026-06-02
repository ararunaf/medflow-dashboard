#!/usr/bin/env node
/**
 * Valida implementacao de logs de seguranca (auth, login, sessao, SSR, tenant).
 *
 * Uso: npm run security-logs-validate
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function runChecks() {
  const checks = [];
  let ok = true;

  function pass(id, message) {
    checks.push({ id, ok: true, message });
  }
  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, message, detail });
  }

  const migrationsDir = join(root, "supabase/migrations");
  const migrationFiles = existsSync(migrationsDir)
    ? readdirSync(migrationsDir).filter((f) => f.includes("security_audit"))
    : [];
  if (migrationFiles.length === 0) {
    fail("migration", "Migration security_audit_logs ausente");
  } else {
    const sql = read(join("supabase/migrations", migrationFiles[0]));
    if (
      sql.includes("security_audit_logs") &&
      sql.includes("ENABLE ROW LEVEL SECURITY") &&
      sql.includes("login_attempt") &&
      sql.includes("tenant_access")
    ) {
      pass("migration", `Tabela security_audit_logs em ${migrationFiles[0]}`);
    } else {
      fail("migration", "Migration incompleta para security_audit_logs");
    }
  }

  const writer = read("src/lib/server/security-audit-writer.ts");
  if (writer.includes("writeSecurityAudit") && writer.includes("[security_audit]")) {
    pass("writer", "security-audit-writer com persistencia e fallback console");
  } else {
    fail("writer", "security-audit-writer ausente ou incompleto");
  }

  const authServer = read("src/lib/security/auth-security-server.ts");
  if (
    authServer.includes("writeSecurityAudit") &&
    authServer.includes("login_gate_blocked") &&
    authServer.includes("tenant_mismatch")
  ) {
    pass("login_attempts", "auth-security-server registra gate e outcomes de login");
  } else {
    fail("login_attempts", "auth-security-server sem logs de login");
  }

  const login = read("src/routes/login.tsx");
  if (login.includes('reason: "tenant_mismatch"') && login.includes("tenantSlug")) {
    pass("tenant_access", "login.tsx envia tenant_mismatch e contexto de tenant");
  } else {
    fail("tenant_access", "login.tsx sem reason tenant_mismatch");
  }

  const sessionAudit = read("src/lib/security/session-audit-server.ts");
  if (sessionAudit.includes("reportSessionAuditFn") && sessionAudit.includes("token_refresh_failed")) {
    pass("session_errors", "reportSessionAuditFn para eventos de sessao");
  } else {
    fail("session_errors", "session-audit-server ausente");
  }

  const authSync = read("src/components/auth-sync.tsx");
  if (authSync.includes("reportSessionAuditFn")) {
    pass("session_client", "AuthSync reporta sessao expirada / token refresh");
  } else {
    fail("session_client", "AuthSync sem reportSessionAuditFn");
  }

  const getAuth = read("src/lib/auth/get-auth-context.ts");
  if (getAuth.includes("get_user_failed") && getAuth.includes("writeSecurityAudit")) {
    pass("auth_logs", "getAuthContext SSR registra falha getUser");
  } else {
    fail("auth_logs", "get-auth-context sem log get_user_failed");
  }

  const serverTs = read("src/server.ts");
  if (
    serverTs.includes("ssr_catastrophic") &&
    serverTs.includes("ssr_worker_uncaught") &&
    serverTs.includes("login_page_rate_limited")
  ) {
    pass("ssr_failures", "server.ts registra SSR catastrofico, uncaught e rate limit login");
  } else {
    fail("ssr_failures", "server.ts sem logs SSR");
  }

  const startTs = read("src/start.ts");
  if (startTs.includes("ssr_middleware_error")) {
    pass("ssr_middleware", "start.ts registra erros do middleware");
  } else {
    fail("ssr_middleware", "start.ts sem ssr_middleware_error");
  }

  const fnHelpers = read("src/lib/server/fn-helpers.ts");
  if (fnHelpers.includes("session_validation_failed")) {
    pass("session_server_fn", "fn-helpers registra validacao de sessao");
  } else {
    fail("session_server_fn", "fn-helpers sem session_validation_failed");
  }

  const envExample = read(".env.example");
  if (envExample.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    pass("env_docs", ".env.example documenta SUPABASE_SERVICE_ROLE_KEY");
  } else {
    fail("env_docs", ".env.example sem SUPABASE_SERVICE_ROLE_KEY");
  }

  return { ok, checks };
}

const result = runChecks();
console.log(JSON.stringify({ validated_at: new Date().toISOString(), ...result }, null, 2));
process.exit(result.ok ? 0 : 1);
