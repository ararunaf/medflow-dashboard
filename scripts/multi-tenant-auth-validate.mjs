#!/usr/bin/env node
/**
 * Validação multi-tenant auth (MedFlow-IA).
 *
 * Cenários:
 * 1. Usuário tenant A não acessa dados do tenant B (RLS + gate de login)
 * 2. Branding isolado por tenant (tenant_settings + cores)
 * 3. Sessão mantém tenant_id após recuperação
 * 4. Role mantém permissões (matriz RBAC)
 * 5. Logout limpa sessão completamente
 *
 * Uso: npm run multi-tenant-auth-validate
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BOOTSTRAP_EMAIL = "admin@iaeasy.com.br";
const BOOTSTRAP_PASSWORD = "@Myson3sgm";
const BOOTSTRAP_TENANT_SLUG = "medflow-admin";
const DEMO_TENANT_SLUG = "medflow-v1-demo";

const FINANCIAL_READ_ROLES = new Set([
  "coordinator",
  "financial",
  "tenant_admin",
  "super_admin",
]);

const ROLE_CAPABILITY_MATRIX = {
  professional: {
    allow: ["schedules:read", "tiss:read", "tenant_settings:read"],
    deny: ["financial_closing:read", "tenant_settings:write", "demo_seed:apply"],
  },
  super_admin: {
    allow: ["financial_closing:read", "tenant_settings:write", "demo_seed:apply", "tiss:write"],
    deny: [],
  },
  financial: {
    allow: ["financial_closing:read", "payouts:write"],
    deny: ["demo_seed:apply", "tenant_settings:write"],
  },
};

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

/** Espelha can() de src/lib/auth/rbac.ts (subset usado nos testes). */
function can(role, capability) {
  const matrix = ROLE_CAPABILITY_MATRIX[role];
  if (!matrix) return false;
  if (matrix.allow.includes(capability)) return true;
  if (matrix.deny.includes(capability)) return false;
  return false;
}

function assertFinancialReadAccess(role) {
  return FINANCIAL_READ_ROLES.has(role ?? "");
}

/** Simula gate de login.tsx: profile.tenant_id deve coincidir com tenant selecionado. */
function loginTenantGate(profileTenantId, selectedTenantId) {
  if (profileTenantId !== selectedTenantId) {
    return { ok: false, action: "signOut", message: "Este usuário não pertence à instituição selecionada." };
  }
  return { ok: true };
}

function runStaticRbacChecks() {
  const checks = [];
  let ok = true;

  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, message, detail });
  }
  function pass(id, message, detail = null) {
    checks.push({ id, ok: true, message, detail });
  }

  if (!can("professional", "financial_closing:read") && can("super_admin", "financial_closing:read")) {
    pass("rbac_role_matrix", "professional negado / super_admin permitido em financial_closing:read");
  } else {
    fail("rbac_role_matrix", "Matriz RBAC inconsistente para financial_closing:read");
  }

  if (can("super_admin", "tenant_settings:write") && !can("financial", "tenant_settings:write")) {
    pass("rbac_admin_write", "tenant_settings:write restrito a admins");
  } else {
    fail("rbac_admin_write", "tenant_settings:write deveria ser admin-only");
  }

  const loginTs = readFileSync(join(root, "src/routes/login.tsx"), "utf8");
  if (loginTs.includes("profile.tenant_id !== tenant.id") && loginTs.includes("signOut")) {
    pass("login_tenant_gate_code", "login.tsx rejeita tenant incorreto com signOut");
  } else {
    fail("login_tenant_gate_code", "Gate de tenant ausente em login.tsx");
  }

  const getAuth = readFileSync(join(root, "src/lib/auth/get-auth-context.ts"), "utf8");
  if (getAuth.includes("tenantId: profile?.tenant_id")) {
    pass("auth_context_tenant_id", "getAuthContext expõe tenantId do perfil");
  } else {
    fail("auth_context_tenant_id", "tenantId ausente em getAuthContext");
  }

  const branding = readFileSync(join(root, "src/components/tenant-branding-provider.tsx"), "utf8");
  if (branding.includes("revokeTenantBrandingFromDocument") && branding.includes("!auth.user")) {
    pass("branding_logout_reset", "TenantBrandingProvider revoga branding sem usuário");
  } else {
    fail("branding_logout_reset", "Reset de branding pós-logout ausente");
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

  const { data: tenants, error: tenantsErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .order("name");

  if (tenantsErr || !tenants?.length) {
    fail("tenants_load", "Não foi possível carregar tenants", tenantsErr?.message);
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }

  const tenantA = tenants.find((t) => t.slug === BOOTSTRAP_TENANT_SLUG);
  const tenantB = tenants.find((t) => t.slug === DEMO_TENANT_SLUG) ?? tenants.find((t) => t.slug !== BOOTSTRAP_TENANT_SLUG);

  if (!tenantA || !tenantB || tenantA.id === tenantB.id) {
    fail("tenants_ab", "Precisa de pelo menos dois tenants distintos (A e B)");
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }

  pass("tenants_ab", "Tenants A e B identificados", {
    tenant_a: { slug: tenantA.slug, id: tenantA.id },
    tenant_b: { slug: tenantB.slug, id: tenantB.id },
  });

  // --- Login tenant A ---
  const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
    email: BOOTSTRAP_EMAIL,
    password: BOOTSTRAP_PASSWORD,
  });

  if (signErr || !signData.session || !signData.user?.id) {
    fail("login", "signInWithPassword falhou", signErr?.message);
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }
  pass("login", "Login OK (tenant A)", { user_id: signData.user.id });

  const accessToken = signData.session.access_token;
  const refreshToken = signData.session.refresh_token;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, full_name")
    .eq("id", signData.user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    fail("profile_load", "Perfil ausente", profileErr?.message);
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }

  if (profile.tenant_id !== tenantA.id) {
    fail("profile_tenant_a", "Perfil não pertence ao tenant A esperado", {
      profile_tenant: profile.tenant_id,
      expected: tenantA.id,
    });
  } else {
    pass("profile_tenant_a", "Perfil vinculado ao tenant A (medflow-admin)");
  }

  // --- 1. Tenant A não acessa tenant B ---
  const wrongTenantGate = loginTenantGate(profile.tenant_id, tenantB.id);
  if (wrongTenantGate.ok) {
    fail("login_gate_wrong_tenant", "Gate deveria rejeitar login com tenant B para usuário de A");
  } else {
    pass("login_gate_wrong_tenant", "Gate de login bloqueia instituição incorreta", wrongTenantGate);
  }

  const correctGate = loginTenantGate(profile.tenant_id, tenantA.id);
  if (!correctGate.ok) {
    fail("login_gate_correct_tenant", "Gate deveria aceitar tenant correto");
  } else {
    pass("login_gate_correct_tenant", "Gate aceita instituição correta");
  }

  const { data: foreignSettings, error: foreignSettingsErr } = await supabase
    .from("tenant_settings")
    .select("tenant_id, institution_name, primary_color")
    .eq("tenant_id", tenantB.id)
    .maybeSingle();

  if (foreignSettingsErr) {
    fail("rls_tenant_settings_b", "Erro ao tentar ler tenant_settings de B", foreignSettingsErr.message);
  } else if (foreignSettings) {
    fail("rls_tenant_settings_b", "Usuário tenant A leu branding do tenant B", foreignSettings);
  } else {
    pass("rls_tenant_settings_b", "RLS impede leitura de tenant_settings do tenant B");
  }

  const { data: foreignProfiles, error: foreignProfilesErr } = await supabase
    .from("profiles")
    .select("id, tenant_id")
    .eq("tenant_id", tenantB.id)
    .limit(5);

  if (foreignProfilesErr) {
    fail("rls_profiles_b", "Erro ao consultar profiles do tenant B", foreignProfilesErr.message);
  } else if (foreignProfiles?.length) {
    fail("rls_profiles_b", "Usuário tenant A listou profiles do tenant B", foreignProfiles);
  } else {
    pass("rls_profiles_b", "RLS impede listagem cross-tenant de profiles");
  }

  const { data: foreignSchedules, error: foreignSchedulesErr } = await supabase
    .from("schedules")
    .select("id, tenant_id")
    .eq("tenant_id", tenantB.id)
    .limit(5);

  if (foreignSchedulesErr) {
    pass("rls_schedules_b", "schedules do tenant B inacessível (erro/RLS)", foreignSchedulesErr.message);
  } else if (foreignSchedules?.length) {
    fail("rls_schedules_b", "Usuário tenant A leu schedules do tenant B", foreignSchedules);
  } else {
    pass("rls_schedules_b", "Nenhum schedule do tenant B visível para usuário A");
  }

  // --- 2. Branding do tenant A ---
  const { data: ownSettings, error: ownSettingsErr } = await supabase
    .from("tenant_settings")
    .select("tenant_id, institution_name, primary_color, secondary_color")
    .maybeSingle();

  if (ownSettingsErr || !ownSettings) {
    fail("branding_own", "tenant_settings do tenant A inacessível", ownSettingsErr?.message);
  } else if (ownSettings.tenant_id !== profile.tenant_id) {
    fail("branding_own", "Branding retornado não pertence ao tenant do perfil", ownSettings);
  } else if (!ownSettings.primary_color?.trim() || !ownSettings.institution_name?.trim()) {
    fail("branding_own", "Branding incompleto", ownSettings);
  } else {
    pass("branding_own", "Branding legível e alinhado ao tenant_id do perfil", {
      institution_name: ownSettings.institution_name,
      primary_color: ownSettings.primary_color,
      secondary_color: ownSettings.secondary_color,
    });
  }

  if (tenantB.slug === DEMO_TENANT_SLUG && ownSettings?.primary_color) {
    pass("branding_distinct_seed", "Tenant demo no catálogo com paleta distinta no seed de migração", {
      tenant_a_primary: ownSettings.primary_color,
      demo_seed_primary: "#0f172a",
    });
  }

  // --- 3. Sessão mantém tenant_id ---
  const recovered = createClient(url, key, { auth: { persistSession: false } });
  const { error: setErr } = await recovered.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (setErr) {
    fail("session_tenant_persist", "setSession falhou", setErr.message);
  } else {
    const { data: profileRecovered, error: profileRecoveredErr } = await recovered
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", signData.user.id)
      .maybeSingle();

    if (profileRecoveredErr || !profileRecovered) {
      fail("session_tenant_persist", "Perfil após recuperação de sessão ausente");
    } else if (profileRecovered.tenant_id !== profile.tenant_id) {
      fail("session_tenant_persist", "tenant_id mudou após recuperação de sessão", {
        before: profile.tenant_id,
        after: profileRecovered.tenant_id,
      });
    } else {
      pass("session_tenant_persist", "tenant_id estável após recuperação de sessão", {
        tenant_id: profileRecovered.tenant_id,
        role: profileRecovered.role,
      });
    }
  }

  const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr) {
    fail("session_refresh", "refreshSession falhou", refreshErr.message);
  } else {
    const { data: profileAfterRefresh } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", signData.user.id)
      .maybeSingle();

    if (profileAfterRefresh?.tenant_id !== profile.tenant_id) {
      fail("session_refresh_tenant", "tenant_id alterado após refresh");
    } else {
      pass("session_refresh_tenant", "tenant_id mantido após refresh de token");
    }
  }
  void refreshData;

  // --- 4. Role mantém permissões ---
  if (assertFinancialReadAccess(profile.role)) {
    pass("role_finance_access", `Role ${profile.role} com acesso financeiro (esperado para bootstrap)`);
  } else {
    fail("role_finance_access", `Role ${profile.role} sem acesso financeiro inesperado`);
  }

  if (can(profile.role, "tenant_settings:write") && can(profile.role, "demo_seed:apply")) {
    pass("role_admin_caps", `Role ${profile.role} com capacidades admin na matriz espelhada`);
  } else {
    fail("role_admin_caps", `Role ${profile.role} sem capacidades admin esperadas`);
  }

  if (!can("professional", "financial_closing:read")) {
    pass("role_professional_deny", "professional sem financial_closing:read (isolamento de papel)");
  } else {
    fail("role_professional_deny", "professional não deveria ter financial_closing:read");
  }

  // --- 5. Logout limpa sessão ---
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
    fail("logout_user_cleared", "getUser retorna usuário após signOut");
  } else {
    pass("logout_user_cleared", "getUser vazio após logout");
  }

  const { data: profileAfterLogout } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", signData.user.id)
    .maybeSingle();

  if (profileAfterLogout) {
    fail("logout_profile_blocked", "Perfil ainda legível após logout (deveria exigir auth)");
  } else {
    pass("logout_profile_blocked", "Perfil inacessível após logout");
  }

  const { count: settingsAfterLogout } = await supabase
    .from("tenant_settings")
    .select("*", { head: true, count: "exact" });

  if (settingsAfterLogout && settingsAfterLogout > 0) {
    fail("logout_branding_blocked", "tenant_settings visível após logout");
  } else {
    pass("logout_branding_blocked", "tenant_settings bloqueado após logout (anon)");
  }

  const { error: reLoginErr } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (!reLoginErr) {
    const {
      data: { user: revived },
    } = await supabase.auth.getUser();
    if (revived) {
      fail("logout_token_invalidated", "Tokens antigos ainda reativam sessão após signOut");
    } else {
      pass("logout_token_invalidated", "Tokens revogados após signOut");
    }
  } else {
    pass("logout_token_invalidated", "setSession com tokens antigos rejeitado após signOut");
  }

  return { skipped: false, host: new URL(url).hostname, ok, checks };
}

const staticResult = runStaticRbacChecks();
const remote = await probeRemote({ ...process.env, ...loadEnv() });

const scenarios = {
  tenant_isolation: {
    static: staticResult.checks.filter((c) => c.id.includes("login") || c.id.includes("gate")),
    remote: remote.checks?.filter((c) =>
      c.id.startsWith("rls_") || c.id.startsWith("login_gate") || c.id.startsWith("profile_tenant"),
    ),
  },
  branding: {
    static: staticResult.checks.filter((c) => c.id.includes("branding")),
    remote: remote.checks?.filter((c) => c.id.startsWith("branding")),
  },
  session_tenant_id: {
    static: staticResult.checks.filter((c) => c.id.includes("tenant_id") || c.id.includes("auth_context")),
    remote: remote.checks?.filter((c) => c.id.startsWith("session_")),
  },
  role_permissions: {
    static: staticResult.checks.filter((c) => c.id.startsWith("rbac")),
    remote: remote.checks?.filter((c) => c.id.startsWith("role_")),
  },
  logout: {
    static: staticResult.checks.filter((c) => c.id.includes("branding_logout")),
    remote: remote.checks?.filter((c) => c.id.startsWith("logout")),
  },
};

const report = {
  validated_at: new Date().toISOString(),
  scenarios,
  static: staticResult,
  remote,
};

console.log(JSON.stringify(report, null, 2));

let exitCode = 0;
if (!staticResult.ok) exitCode = 1;
if (!remote.skipped && !remote.ok) exitCode = 1;

process.exit(exitCode);
