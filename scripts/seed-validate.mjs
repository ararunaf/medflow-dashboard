#!/usr/bin/env node
/**
 * Valida seeds mínimos e fluxos críticos de login / tenant selector / branding.
 * Requer VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (.env.local).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const MIN_TENANT_SLUGS = [
  "hospital-saojose",
  "cooperativa-med",
  "grupo-vida",
  "medflow-v1-demo",
  "medflow-admin",
];

const USER_ROLE_VALUES = [
  "super_admin",
  "tenant_admin",
  "coordinator",
  "professional",
  "financial",
];

const BOOTSTRAP_EMAIL = "admin@iaeasy.com.br";
const BOOTSTRAP_PASSWORD = "@Myson3sgm";
const BOOTSTRAP_TENANT_SLUG = "medflow-admin";
const BOOTSTRAP_ROLE = "super_admin";
const APPLY_BACKFILL = process.argv.includes("--fix");

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

function readMigrationSeeds() {
  const init = readFileSync(
    join(root, "supabase/migrations/20250512000000_init_enterprise.sql"),
    "utf8",
  );
  const branding = readFileSync(
    join(root, "supabase/migrations/20250514120000_tenant_settings_branding_readiness.sql"),
    "utf8",
  );
  const bootstrap = readFileSync(
    join(root, "supabase/migrations/20250517171500_bootstrap_system_admin.sql"),
    "utf8",
  );

  const tenantSlugsInSql = [...init.matchAll(/\('([^']+)',\s*'([^']+)'\)/g)]
    .filter((m) => MIN_TENANT_SLUGS.includes(m[2]))
    .map((m) => m[2]);

  return {
    tenants_in_migrations: [...new Set(tenantSlugsInSql)],
    has_user_role_enum: /CREATE TYPE public\.user_role AS ENUM/i.test(init),
    user_roles_in_enum: USER_ROLE_VALUES.every((r) => init.includes(`'${r}'`)),
    has_tenant_settings_backfill: /INSERT INTO public\.tenant_settings/i.test(branding),
    has_demo_tenant: branding.includes("medflow-v1-demo"),
    has_bootstrap_profile: bootstrap.includes("INSERT INTO public.profiles"),
    bootstrap_role: bootstrap.includes(`'${BOOTSTRAP_ROLE}'`),
  };
}

async function probeRemote(env) {
  const url = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { skipped: true, reason: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes" };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const checks = [];
  let ok = true;

  function fail(id, message, detail = null) {
    ok = false;
    checks.push({ id, ok: false, message, detail });
  }

  function pass(id, message, detail = null) {
    checks.push({ id, ok: true, message, detail });
  }

  // --- Tenant selector (anon, como /login) ---
  const { data: tenants, error: tenantsErr } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .order("name");

  if (tenantsErr || !tenants?.length) {
    fail(
      "tenant_selector",
      "Não foi possível carregar tenants (anon)",
      tenantsErr?.message ?? "lista vazia",
    );
  } else {
    pass("tenant_selector", `${tenants.length} instituição(ões) visíveis no login`, {
      slugs: tenants.map((t) => t.slug),
    });
  }

  const missingSlugs = MIN_TENANT_SLUGS.filter((s) => !tenants?.some((t) => t.slug === s));
  if (missingSlugs.length) {
    fail("tenants_minimum", `Slugs de seed ausentes: ${missingSlugs.join(", ")}`);
  } else {
    pass("tenants_minimum", "Todos os tenants mínimos presentes");
  }

  // tenant_settings: anon não deve ver (RLS) — validado após login
  const { count: settingsAnonCount, error: settingsAnonErr } = await supabase
    .from("tenant_settings")
    .select("*", { head: true, count: "exact" });

  if (settingsAnonErr) {
    fail("branding_rls_anon", "Erro ao consultar tenant_settings como anon", settingsAnonErr.message);
  } else if (settingsAnonCount && settingsAnonCount > 0) {
    fail(
      "branding_rls_anon",
      "tenant_settings não deveria ser legível por anon",
      String(settingsAnonCount),
    );
  } else {
    pass("branding_rls_anon", "RLS bloqueia tenant_settings para anon (esperado)");
  }

  // Storage bucket
  const { error: bucketErr } = await supabase.storage.from("tenant-branding").list("", { limit: 1 });
  if (bucketErr) {
    fail("branding_storage", "Bucket tenant-branding inacessível", bucketErr.message);
  } else {
    pass("branding_storage", "Bucket tenant-branding existe");
  }

  // --- Login funcional ---
  const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
    email: BOOTSTRAP_EMAIL,
    password: BOOTSTRAP_PASSWORD,
  });

  if (signErr || !signData.user?.id) {
    fail("login", "Login bootstrap falhou", signErr?.message ?? "sem user id");
    return { skipped: false, host: new URL(url).hostname, ok, checks };
  }

  pass("login", "Autenticação bootstrap OK", { user_id: signData.user.id });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, tenant_id, role, full_name")
    .eq("id", signData.user.id)
    .maybeSingle();

  if (profileErr || !profile) {
    fail("profiles_minimum", "Perfil bootstrap ausente após login", profileErr?.message ?? null);
  } else {
    pass("profiles_minimum", "Perfil bootstrap presente", profile);
    if (profile.role !== BOOTSTRAP_ROLE) {
      fail("roles_minimum", `Role esperada ${BOOTSTRAP_ROLE}, obtida ${profile.role}`);
    } else {
      pass("roles_minimum", `Role ${BOOTSTRAP_ROLE} confirmada no perfil bootstrap`);
    }

    const adminTenant = tenants?.find((t) => t.slug === BOOTSTRAP_TENANT_SLUG);
    if (!adminTenant) {
      fail("login_tenant_match", `Tenant ${BOOTSTRAP_TENANT_SLUG} não encontrado`);
    } else if (profile.tenant_id !== adminTenant.id) {
      fail(
        "login_tenant_match",
        "Perfil não pertence ao tenant medflow-admin (fluxo /login)",
        { profile_tenant: profile.tenant_id, expected: adminTenant.id },
      );
    } else {
      pass("login_tenant_match", "Perfil alinhado ao tenant do login");
    }
  }

  // --- Branding funcional (autenticado) ---
  const { data: settings, error: settingsErr } = await supabase
    .from("tenant_settings")
    .select(
      "tenant_id, institution_name, primary_color, secondary_color, logo_url, favicon_url, banner_url",
    )
    .maybeSingle();

  if (settingsErr || !settings) {
    if (APPLY_BACKFILL && profile?.tenant_id && !settings && !settingsErr) {
      const adminTenant = tenants?.find((t) => t.slug === BOOTSTRAP_TENANT_SLUG);
      const { error: insertErr } = await supabase.from("tenant_settings").insert({
        tenant_id: profile.tenant_id,
        institution_name: adminTenant?.name?.trim() || "MedicFlow-AI Administração",
        primary_color: "#1e3a5f",
        secondary_color: "#0d9488",
        contact_email: BOOTSTRAP_EMAIL,
      });
      if (insertErr) {
        fail("branding_backfill", "Backfill tenant_settings falhou", insertErr.message);
      } else {
        pass("branding_backfill", "tenant_settings criado via --fix (super_admin)");
        const { data: settingsAfter } = await supabase
          .from("tenant_settings")
          .select(
            "tenant_id, institution_name, primary_color, secondary_color, logo_url, favicon_url, banner_url",
          )
          .maybeSingle();
        if (settingsAfter) {
          pass("branding_minimum", "Branding institucional legível após login", {
            institution_name: settingsAfter.institution_name,
            primary_color: settingsAfter.primary_color,
            secondary_color: settingsAfter.secondary_color,
            has_logo: Boolean(settingsAfter.logo_url?.trim()),
          });
        }
      }
    } else {
      fail(
        "branding_minimum",
        "tenant_settings inacessível após login",
        settingsErr?.message ?? "sem registro — rode migration 20250524120000 ou npm run seed-validate -- --fix",
      );
    }
  } else {
    const hasColors =
      Boolean(settings.primary_color?.trim()) && Boolean(settings.secondary_color?.trim());
    const hasName = Boolean(settings.institution_name?.trim());
    if (!hasColors || !hasName) {
      fail("branding_minimum", "Branding incompleto (nome ou cores)", settings);
    } else {
      pass("branding_minimum", "Branding institucional legível após login", {
        institution_name: settings.institution_name,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        has_logo: Boolean(settings.logo_url?.trim()),
      });
    }
  }

  await supabase.auth.signOut();
  return { skipped: false, host: new URL(url).hostname, ok, checks };
}

const local = readMigrationSeeds();
const remote = await probeRemote({ ...process.env, ...loadEnv() });

const report = {
  validated_at: new Date().toISOString(),
  local,
  remote,
};

console.log(JSON.stringify(report, null, 2));

let exitCode = 0;
if (!local.has_user_role_enum || !local.user_roles_in_enum) exitCode = 1;
if (!local.has_tenant_settings_backfill || !local.has_bootstrap_profile) exitCode = 1;
if (!remote.skipped && !remote.ok) exitCode = 1;

process.exit(exitCode);
