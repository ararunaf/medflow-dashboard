#!/usr/bin/env node
/**
 * Valida headers de segurança, CORS, cookies de sessão e padrões de auth.
 *
 * Uso: npm run security-headers-validate
 */
import { existsSync, readFileSync } from "node:fs";
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
  let warnings = 0;

  function pass(id, message, detail = null) {
    checks.push({ id, ok: true, level: "pass", message, detail });
  }
  function warn(id, message, detail = null) {
    warnings += 1;
    checks.push({ id, ok: true, level: "warn", message, detail });
  }
  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, level: "fail", message, detail });
  }

  const cspTs = read("src/lib/security/csp.ts");
  const serverTs = read("src/server.ts");
  const startTs = read("src/start.ts");
  const nitroTs = read("nitro.config.ts");
  const vercelJson = read("vercel.json");
  const getAuth = read("src/lib/auth/get-auth-context.ts");
  const supabaseServer = read("src/lib/server/supabase.ts");
  const browserTs = read("src/lib/supabase/browser.ts");
  const opAuth = read("src/lib/server/operational-auth.ts");
  const supabaseAdmin = read("src/lib/server/supabase-admin.ts");
  const configTs = read("src/lib/supabase/config.ts");

  // --- CSP ---
  if (
    cspTs.includes("buildContentSecurityPolicy") &&
    cspTs.includes("Content-Security-Policy") &&
    cspTs.includes("frame-ancestors 'none'")
  ) {
    pass("csp_defined", "CSP definido em csp.ts (prod restritivo + dev relaxado)");
  } else {
    fail("csp_defined", "csp.ts sem política CSP completa");
  }

  if (cspTs.includes("default-src 'self'") && cspTs.includes("connect-src 'self' https://*.supabase.co")) {
    pass("csp_prod_directives", "CSP produção: default-src self + Supabase connect");
  } else {
    fail("csp_prod_directives", "CSP produção sem diretivas esperadas");
  }

  if (serverTs.includes("securityHeaders") && serverTs.includes("applySecurityHeaders")) {
    pass("csp_runtime_server", "server.ts aplica securityHeaders em todas as respostas");
  } else {
    fail("csp_runtime_server", "server.ts não aplica headers de segurança");
  }

  if (startTs.includes("applySecurityHeadersTo")) {
    pass("csp_runtime_start", "start.ts aplica headers em páginas de erro SSR");
  } else {
    fail("csp_runtime_start", "start.ts sem applySecurityHeadersTo no middleware de erro");
  }

  if (nitroTs.includes("securityHeaders(true)") && nitroTs.includes("productionSecurityHeaders")) {
    pass("csp_nitro", "nitro.config.ts injeta CSP/HSTS nas routeRules");
  } else {
    fail("csp_nitro", "nitro.config.ts sem securityHeaders em produção");
  }

  if (!vercelJson.includes("Content-Security-Policy")) {
    warn(
      "csp_vercel_json",
      "vercel.json não declara CSP (coberto por Nitro + server.ts em runtime)",
      "Opcional: alinhar vercel.json com csp.ts para assets estáticos servidos antes do worker.",
    );
  } else {
    pass("csp_vercel_json", "vercel.json inclui Content-Security-Policy");
  }

  if (cspTs.includes("'unsafe-inline'") && cspTs.includes("script-src")) {
    warn(
      "csp_unsafe_inline",
      "CSP produção permite script-src 'unsafe-inline'",
      "Aceitável para bundles Vite; endurecer com nonces/hashes quando possível.",
    );
  }

  // --- X-Frame-Options ---
  if (cspTs.includes('"X-Frame-Options": "DENY"')) {
    pass("x_frame_options", "X-Frame-Options: DENY em csp.ts");
  } else {
    fail("x_frame_options", "X-Frame-Options ausente ou incorreto em csp.ts");
  }

  if (vercelJson.includes('"X-Frame-Options"') && vercelJson.includes('"DENY"')) {
    pass("x_frame_vercel", "vercel.json replica X-Frame-Options: DENY");
  } else {
    fail("x_frame_vercel", "vercel.json sem X-Frame-Options: DENY");
  }

  if (cspTs.includes("frame-ancestors 'none'")) {
    pass("csp_frame_ancestors", "CSP frame-ancestors 'none' (reforço anti-clickjacking)");
  } else {
    fail("csp_frame_ancestors", "CSP sem frame-ancestors");
  }

  // --- XSS protection (legado) ---
  if (cspTs.includes("X-XSS-Protection")) {
    pass("xss_protection_header", "X-XSS-Protection presente");
  } else {
    warn(
      "xss_protection_header",
      "X-XSS-Protection omitido (header obsoleto; removido do Chrome)",
      "Mitigação XSS via CSP + X-Content-Type-Options: nosniff — padrão atual.",
    );
  }

  if (cspTs.includes('"X-Content-Type-Options": "nosniff"')) {
    pass("xss_nosniff", "X-Content-Type-Options: nosniff");
  } else {
    fail("xss_nosniff", "X-Content-Type-Options ausente");
  }

  // --- CORS ---
  const srcScan = [
    serverTs,
    nitroTs,
    startTs,
    configTs,
    read("vite.config.ts"),
  ].join("\n");

  if (/Access-Control-Allow-Origin:\s*\*/i.test(srcScan)) {
    fail("cors_wildcard", "Access-Control-Allow-Origin: * detectado no código");
  } else if (/cors\s*\(|@koa\/cors|micro-cors/i.test(srcScan)) {
    warn("cors_middleware", "Middleware CORS detectado — revisar origens permitidas");
  } else {
    pass(
      "cors_same_origin",
      "Sem API CORS pública — app SSR same-origin (auth via cookies + server functions)",
    );
  }

  // --- Secure cookies ---
  const usesSupabaseCookies =
    getAuth.includes("createServerClient") && supabaseServer.includes("createServerClient");

  if (usesSupabaseCookies) {
    pass("cookies_supabase_ssr", "Sessão Supabase via cookies SSR (getCookies/setCookie)");
  } else {
    fail("cookies_supabase_ssr", "Clientes Supabase SSR não encontrados");
  }

  const hasExplicitCookieOptions =
    /cookieOptions\s*:/.test(getAuth) || /cookieOptions\s*:/.test(supabaseServer);

  if (hasExplicitCookieOptions) {
    const cookieBlock = `${getAuth}\n${supabaseServer}`;
    if (/secure\s*:\s*true/.test(cookieBlock)) {
      pass("cookies_secure_flag", "cookieOptions.secure: true configurado no servidor");
    } else {
      warn(
        "cookies_secure_flag",
        "cookieOptions sem secure: true explícito",
        "Supabase SSR default não define Secure; recomendado em produção HTTPS.",
      );
    }
    if (/httpOnly\s*:\s*true/.test(cookieBlock)) {
      pass("cookies_httponly", "cookieOptions.httpOnly: true");
    } else {
      warn(
        "cookies_httponly",
        "httpOnly não forçado — padrão @supabase/ssr (httpOnly: false) para cliente browser",
        "Trade-off documentado: browser client precisa ler cookies de sessão.",
      );
    }
    if (/sameSite\s*:\s*['"]lax['"]/i.test(cookieBlock)) {
      pass("cookies_samesite", "cookieOptions sameSite: lax");
    }
  } else {
    warn(
      "cookies_explicit_options",
      "Sem cookieOptions customizado em createServerClient",
      "Defaults @supabase/ssr: sameSite=lax, httpOnly=false, sem Secure. Adicione secure:true em prod.",
    );
  }

  if (browserTs.includes("createBrowserClient") && !browserTs.includes("localStorage")) {
    pass("cookies_browser_client", "Cliente browser usa @supabase/ssr (cookies, não localStorage manual)");
  }

  // --- Auth headers / tokens ---
  if (
    getAuth.includes("auth.getUser()") &&
    opAuth.includes("auth.getUser()") &&
    !getAuth.includes("getSession()") &&
    !opAuth.includes("getSession()")
  ) {
    pass("auth_get_user", "Validação de sessão via getUser() (não getSession() JWT local)");
  } else {
    fail("auth_get_user", "Fluxo de auth deve usar getUser() no servidor");
  }

  if (!configTs.includes("SERVICE_ROLE") && !browserTs.includes("SERVICE_ROLE")) {
    pass("auth_no_service_role_client", "Service role não exposta no bundle público (config/browser)");
  } else {
    fail("auth_no_service_role_client", "SERVICE_ROLE referenciado em código client-exposed");
  }

  if (
    supabaseAdmin.includes("server-only") ||
    supabaseAdmin.includes("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    pass("auth_service_role_server", "SUPABASE_SERVICE_ROLE_KEY restrita a src/lib/server/");
  } else {
    fail("auth_service_role_server", "supabase-admin.ts sem isolamento documentado");
  }

  const healthTs = existsSync(join(root, "src/lib/server/health-checks.ts"))
    ? read("src/lib/server/health-checks.ts")
    : "";
  if (healthTs.includes("Authorization: `Bearer ${cfg.anonKey}`")) {
    pass("auth_bearer_health", "Bearer anon apenas em health-check server-side");
  }

  const gptPath = join(root, "src/lib/server/operational-gpt-openai.ts");
  if (existsSync(gptPath)) {
    const gpt = read("src/lib/server/operational-gpt-openai.ts");
    if (gpt.includes("authorization: `Bearer ${apiKey}`") && !gpt.includes("VITE_")) {
      pass("auth_bearer_openai", "OpenAI Bearer só no servidor (env não-VITE)");
    } else {
      warn("auth_bearer_openai", "Revisar exposição da chave OpenAI em operational-gpt-openai.ts");
    }
  }

  // --- HSTS / extras ---
  if (cspTs.includes("Strict-Transport-Security") && vercelJson.includes("Strict-Transport-Security")) {
    pass("hsts", "HSTS em csp.ts e vercel.json");
  } else {
    fail("hsts", "HSTS ausente em csp.ts ou vercel.json");
  }

  return { ok, warnings, checks };
}

console.log("\n[medflow] security-headers-validate\n");

const { ok, warnings, checks } = runChecks();

for (const c of checks) {
  const icon = c.level === "fail" ? "✗" : c.level === "warn" ? "!" : "✓";
  console.log(`  ${icon} [${c.id}] ${c.message}`);
  if (c.detail) console.log(`      ${c.detail}`);
}

console.log(
  ok
    ? `\n✓ security-headers-validate OK (${warnings} aviso(s))\n`
    : `\n✗ security-headers-validate com falhas (${warnings} aviso(s))\n`,
);
process.exit(ok ? 0 : 1);
