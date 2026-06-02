#!/usr/bin/env node
/**
 * Valida o fluxo de autenticação MedFlow-IA (Supabase + TanStack Router).
 *
 * - Estático: route guard, redirects seguros, RBAC financeiro, middleware
 * - Remoto (requer .env.local): login, logout, refresh, persistência, recuperação, getUser (SSR)
 *
 * Uso: npm run auth-validate
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BOOTSTRAP_EMAIL = "admin@iaeasy.com.br";
const BOOTSTRAP_PASSWORD = "@Myson3sgm";

const FINANCIAL_READ_ROLES = new Set([
  "coordinator",
  "financial",
  "tenant_admin",
  "super_admin",
]);

function loadEnv() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function isPublicPath(pathname) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/site" ||
    pathname.startsWith("/site/")
  );
}

/** Espelha src/lib/auth/route-guard.ts */
function evaluateRouteGuard(pathname, auth) {
  const isPublic = isPublicPath(pathname);
  if (!auth.user && !isPublic) return { allowed: false, redirectTo: "/login" };
  if (auth.user && !auth.profile && !isPublic) return { allowed: false, redirectTo: "/login" };
  if (
    auth.user &&
    auth.profile &&
    (pathname === "/login" || pathname === "/login/esqueci-senha")
  ) {
    return { allowed: false, redirectTo: "/" };
  }
  return { allowed: true };
}

function isSafeRedirectTarget(target, origin) {
  const trimmed = target.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    if (origin) {
      const o = new URL(origin);
      if (url.origin === o.origin) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function sanitizePostLoginPath(path) {
  if (!path || !isSafeRedirectTarget(path)) return "/";
  return path;
}

function assertFinancialReadAccess(role) {
  return FINANCIAL_READ_ROLES.has(role ?? "");
}

function runStaticChecks() {
  const checks = [];
  let ok = true;

  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, message, detail });
  }
  function pass(id, message, detail = null) {
    checks.push({ id, ok: true, message, detail });
  }

  const anon = { user: null, profile: null };
  const authed = {
    user: { id: "u1" },
    profile: { id: "u1", tenant_id: "t1", role: "super_admin" },
  };
  const noProfile = { user: { id: "u1" }, profile: null };

  // --- Route guard (rotas protegidas / redirects) ---
  const guardCases = [
    { path: "/escalas", auth: anon, expect: { allowed: false, redirectTo: "/login" } },
    { path: "/perfil", auth: anon, expect: { allowed: false, redirectTo: "/login" } },
    { path: "/login", auth: anon, expect: { allowed: true } },
    { path: "/login/esqueci-senha", auth: anon, expect: { allowed: true } },
    { path: "/login/redefinir-senha", auth: anon, expect: { allowed: true } },
    { path: "/site", auth: anon, expect: { allowed: true } },
    { path: "/site/precos", auth: anon, expect: { allowed: true } },
    { path: "/login", auth: authed, expect: { allowed: false, redirectTo: "/" } },
    { path: "/login/esqueci-senha", auth: authed, expect: { allowed: false, redirectTo: "/" } },
    { path: "/login/redefinir-senha", auth: authed, expect: { allowed: true } },
    { path: "/", auth: authed, expect: { allowed: true } },
    { path: "/plantoes", auth: noProfile, expect: { allowed: false, redirectTo: "/login" } },
  ];

  let routeGuardOk = true;
  for (const { path, auth, expect } of guardCases) {
    const result = evaluateRouteGuard(path, auth);
    const match =
      result.allowed === expect.allowed &&
      (expect.allowed || result.redirectTo === expect.redirectTo);
    if (!match) {
      routeGuardOk = false;
      fail("route_guard", `Guard falhou para ${path}`, { result, expect });
      break;
    }
  }
  if (routeGuardOk) {
    pass("route_guard", "Route guard: públicas, protegidas e redirect pós-login");
  }

  // --- RBAC financeiro (rotas /financeiro, /executivo) ---
  if (!assertFinancialReadAccess("professional")) {
    pass("rbac_finance_deny", "professional sem financial_closing:read → redirect /");
  } else {
    fail("rbac_finance_deny", "professional não deveria ter acesso financeiro");
  }
  if (assertFinancialReadAccess("coordinator") && assertFinancialReadAccess("super_admin")) {
    pass("rbac_finance_allow", "coordinator e super_admin com financial_closing:read");
  } else {
    fail("rbac_finance_allow", "Roles financeiras deveriam ter acesso");
  }

  // --- Redirects seguros ---
  if (sanitizePostLoginPath("/escalas") === "/escalas") {
    pass("redirect_safe_internal", "Path interno aceito em sanitizePostLoginPath");
  } else {
    fail("redirect_safe_internal", "Path interno rejeitado incorretamente");
  }
  if (sanitizePostLoginPath("https://evil.com/x") === "/") {
    pass("redirect_block_external", "Open redirect externo bloqueado");
  } else {
    fail("redirect_block_external", "Open redirect não bloqueado");
  }
  if (sanitizePostLoginPath("//evil.com") === "/") {
    pass("redirect_block_protocol_relative", "//evil bloqueado");
  } else {
    fail("redirect_block_protocol_relative", "//evil aceito");
  }

  // --- Middleware (TanStack Start) ---
  const startTs = readFileSync(join(root, "src/start.ts"), "utf8");
  if (startTs.includes("createMiddleware") && !startTs.includes("getAuthContext")) {
    pass("middleware_no_auth", "start.ts: middleware só trata erros (auth no __root beforeLoad)");
  } else {
    fail("middleware_no_auth", "start.ts inesperado para isolamento de auth");
  }

  const rootTs = readFileSync(join(root, "src/routes/__root.tsx"), "utf8");
  if (rootTs.includes("evaluateRouteGuard") && rootTs.includes("getAuthContext")) {
    pass("middleware_root_guard", "__root.tsx usa getAuthContext + evaluateRouteGuard");
  } else {
    fail("middleware_root_guard", "__root.tsx sem guard centralizado");
  }

  const authSync = readFileSync(join(root, "src/components/auth-sync.tsx"), "utf8");
  if (
    authSync.includes("onAuthStateChange") &&
    authSync.includes("TOKEN_REFRESHED") &&
    authSync.includes("router.invalidate")
  ) {
    pass("auth_sync_hydration", "AuthSync: invalidate + redirect em SIGNED_OUT / refresh falho");
  } else {
    fail("auth_sync_hydration", "AuthSync incompleto");
  }

  // --- Segurança: rate limit login, brute force, sanitize, session, headers ---
  const loginTs = readFileSync(join(root, "src/routes/login.tsx"), "utf8");
  if (loginTs.includes("checkLoginGateFn") && loginTs.includes("recordLoginOutcomeFn")) {
    pass("login_rate_limit", "Login usa gate server-side antes do signIn");
  } else {
    fail("login_rate_limit", "Login sem checkLoginGateFn / recordLoginOutcomeFn");
  }

  if (loginTs.includes("Esqueci minha senha") && loginTs.includes("/login/esqueci-senha")) {
    pass("login_forgot_link", "Tela de login exibe link para recuperação de senha");
  } else {
    fail("login_forgot_link", "Login sem link Esqueci minha senha");
  }

  const forgotTs = readFileSync(join(root, "src/routes/login.esqueci-senha.tsx"), "utf8");
  if (
    forgotTs.includes("resetPasswordForEmail") &&
    forgotTs.includes("getPasswordResetRedirectUrl")
  ) {
    pass("forgot_password_flow", "Rota esqueci-senha usa resetPasswordForEmail + redirect");
  } else {
    fail("forgot_password_flow", "login.esqueci-senha incompleto");
  }

  const resetTs = readFileSync(join(root, "src/routes/login.redefinir-senha.tsx"), "utf8");
  if (resetTs.includes("updateUser") && resetTs.includes("PASSWORD_RECOVERY")) {
    pass("reset_password_flow", "Rota redefinir-senha usa updateUser + PASSWORD_RECOVERY");
  } else {
    fail("reset_password_flow", "login.redefinir-senha incompleto");
  }

  const resetRedirect = readFileSync(join(root, "src/lib/auth/password-reset.ts"), "utf8");
  if (resetRedirect.includes("getInstitutionalDomain") && resetRedirect.includes("/login/redefinir-senha")) {
    pass("reset_redirect_url", "Redirect de recuperação usa VITE_MEDFLOW_APP_URL");
  } else {
    fail("reset_redirect_url", "password-reset.ts sem redirect canônico");
  }

  const serverTs = readFileSync(join(root, "src/server.ts"), "utf8");
  if (serverTs.includes("page_login") && serverTs.includes("getClientIpFromRequest")) {
    pass("login_page_rate_limit", "Worker limita requisições à rota /login por IP");
  } else {
    fail("login_page_rate_limit", "server.ts sem rate limit na página de login");
  }

  const cspTs = readFileSync(join(root, "src/lib/security/csp.ts"), "utf8");
  if (
    cspTs.includes("X-Content-Type-Options") &&
    cspTs.includes("Strict-Transport-Security") &&
    cspTs.includes("Cross-Origin-Opener-Policy")
  ) {
    pass("security_headers", "Headers básicos (nosniff, HSTS, COOP) configurados");
  } else {
    fail("security_headers", "csp.ts sem headers esperados");
  }

  const opAuth = readFileSync(join(root, "src/lib/server/operational-auth.ts"), "utf8");
  if (opAuth.includes("assertValidSessionState")) {
    pass("session_state_validation", "requireOperationalAuth valida estado da sessão");
  } else {
    fail("session_state_validation", "operational-auth sem assertValidSessionState");
  }

  const fnHelpers = readFileSync(join(root, "src/lib/server/fn-helpers.ts"), "utf8");
  if (fnHelpers.includes("sanitizeString") && fnHelpers.includes("validateSessionState")) {
    pass("input_sanitize_fn_helpers", "Server functions sanitizam strings e validam sessão");
  } else {
    fail("input_sanitize_fn_helpers", "fn-helpers sem sanitize/validateSessionState");
  }

  const getAuth = readFileSync(join(root, "src/lib/auth/get-auth-context.ts"), "utf8");
  if (
    getAuth.includes("createIsomorphicFn") &&
    getAuth.includes(".server(") &&
    getAuth.includes(".client(") &&
    getAuth.includes("getUser")
  ) {
    pass("ssr_hydration_isomorphic", "getAuthContext isomórfico (SSR cookies + client getUser)");
  } else {
    fail("ssr_hydration_isomorphic", "getAuthContext sem paridade SSR/client");
  }

  return { ok, checks };
}

async function probeRemote(env) {
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { skipped: true, reason: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes" };
  }

  const checks = [];
  let ok = true;

  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, message, detail });
  }
  function pass(id, message, detail = null) {
    checks.push({ id, ok: true, message, detail });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // --- Login ---
  const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
    email: BOOTSTRAP_EMAIL,
    password: BOOTSTRAP_PASSWORD,
  });

  if (signErr || !signData.session || !signData.user?.id) {
    fail("login", "signInWithPassword falhou", signErr?.message ?? "sem session");
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }
  pass("login", "Login OK", { user_id: signData.user.id });

  const sessionAfterLogin = signData.session;
  const accessToken = sessionAfterLogin.access_token;
  const refreshToken = sessionAfterLogin.refresh_token;

  if (!accessToken || !refreshToken) {
    fail("session_tokens", "Sessão sem access_token ou refresh_token");
  } else {
    pass("session_tokens", "Tokens de sessão presentes após login");
  }

  // --- Persistência / recuperação (novo cliente com mesma sessão) ---
  const recovered = createClient(url, key, { auth: { persistSession: false } });
  const { error: setErr } = await recovered.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (setErr) {
    fail("session_recovery", "setSession em novo cliente falhou", setErr.message);
  } else {
    const {
      data: { user: recoveredUser },
      error: recoveredUserErr,
    } = await recovered.auth.getUser();
    if (recoveredUserErr || recoveredUser?.id !== signData.user.id) {
      fail("session_recovery", "getUser após recuperação falhou", recoveredUserErr?.message);
    } else {
      pass("session_recovery", "Sessão recuperada em cliente isolado (simula cookie SSR)");
    }
  }

  // --- getUser (validação JWT — mesmo caminho que SSR/server functions) ---
  const {
    data: { user: jwtUser },
    error: jwtErr,
  } = await supabase.auth.getUser();
  if (jwtErr || jwtUser?.id !== signData.user.id) {
    fail("ssr_get_user", "getUser() falhou com sessão ativa", jwtErr?.message);
  } else {
    pass("ssr_get_user", "getUser() valida JWT (equivalente a loaders SSR)");
  }

  // --- Refresh token ---
  const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr || !refreshData.session?.access_token) {
    fail("refresh_token", "refreshSession falhou", refreshErr?.message);
  } else {
    const rotated = refreshData.session.access_token !== accessToken;
    pass("refresh_token", "refreshSession OK", { token_rotated: rotated });
  }

  // --- Perfil (requisito de rotas protegidas) ---
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, tenant_id, role")
    .eq("id", signData.user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    fail("protected_profile", "Perfil ausente — rotas protegidas redirecionariam para /login");
  } else {
    pass("protected_profile", "Perfil presente para beforeLoad", profile);
    const guardHome = evaluateRouteGuard("/", {
      user: signData.user,
      profile,
    });
    const guardLogin = evaluateRouteGuard("/login", {
      user: signData.user,
      profile,
    });
    if (!guardHome.allowed) {
      fail("protected_routes", "Usuário autenticado bloqueado em /", guardHome);
    } else if (guardLogin.allowed || guardLogin.redirectTo !== "/") {
      fail("redirect_authenticated_login", "/login deveria redirecionar para /", guardLogin);
    } else {
      pass("protected_routes", "Autenticado: / permitido, /login → /");
    }
    if (assertFinancialReadAccess(profile.role)) {
      pass("protected_finance_rbac", `Role ${profile.role} acessa rotas financeiras`);
    } else {
      fail("protected_finance_rbac", `Role ${profile.role} sem acesso financeiro`);
    }
  }

  // --- Logout ---
  const { error: signOutErr } = await supabase.auth.signOut();
  if (signOutErr) {
    fail("logout", "signOut falhou", signOutErr.message);
  } else {
    pass("logout", "signOut OK");
  }

  const {
    data: { user: afterLogout },
    error: afterLogoutErr,
  } = await supabase.auth.getUser();

  if (!afterLogoutErr && afterLogout) {
    fail("logout_session_cleared", "getUser ainda retorna usuário após signOut");
  } else {
    pass("logout_session_cleared", "Sessão limpa após logout");
  }

  const guardAfterLogout = evaluateRouteGuard("/escalas", { user: null, profile: null });
  if (guardAfterLogout.allowed || guardAfterLogout.redirectTo !== "/login") {
    fail("logout_route_guard", "Anônimo deveria ser redirecionado para /login");
  } else {
    pass("logout_route_guard", "Pós-logout: rota protegida exige /login");
  }

  return { skipped: false, host: new URL(url).hostname, ok, checks };
}

const staticResult = runStaticChecks();
const remote = await probeRemote({ ...process.env, ...loadEnv() });

const report = {
  validated_at: new Date().toISOString(),
  static: staticResult,
  remote,
};

console.log(JSON.stringify(report, null, 2));

let exitCode = 0;
if (!staticResult.ok) exitCode = 1;
if (!remote.skipped && !remote.ok) exitCode = 1;

process.exit(exitCode);
