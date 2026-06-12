#!/usr/bin/env node
/**
 * Captura screenshots REAIS da Central de Ajuda em staging (autenticado).
 * Uso: node scripts/capture-help-center-staging-screenshots.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots", "help-center-staging");
const BASE_URL = "https://staging.medicflow.app.br";
const SUPABASE_URL = "https://utodixhxrvegzafcldpu.supabase.co";
const SUPABASE_ANON = "sb_publishable_gO14rxQxKwrQ3FfVFR9OBg_12hbDhZr";

const LOGIN = {
  tenantSlug: "medflow-v1-demo",
  email: "admin.teste@medicflow.app.br",
  password: process.env.TEST_ADMIN_PASSWORD ?? "MedicFlow@2026!",
};

async function getSupabaseSession() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({
    email: LOGIN.email,
    password: LOGIN.password,
  });
  if (error || !data.session) throw new Error(error?.message ?? "Falha ao obter sessão Supabase");
  return data.session;
}

function sessionToAuthCookie(session) {
  const host = new URL(BASE_URL).hostname;
  const name = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  return { name, value, domain: host, path: "/", sameSite: "Lax" };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[medflow] Help center staging — ${BASE_URL}/ajuda\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  const checks = {
    workflow: false,
    apresentacao: false,
    download: false,
    visualizar: false,
    ia: false,
    primeirosPassos: false,
  };

  try {
    const session = await getSupabaseSession();
    await context.addCookies([sessionToAuthCookie(session)]);
    console.log(`  ✓ Login autenticado (${LOGIN.email})`);

    await page.goto(`${BASE_URL}/ajuda`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4000);

    if (page.url().includes("/login")) {
      throw new Error("Redirecionado para login — sessão não aplicada");
    }

    checks.workflow = await page.locator("#workflow").isVisible();
    checks.apresentacao = await page.locator("#apresentacao").isVisible();
    checks.ia = await page.locator("#ia").isVisible();
    checks.primeirosPassos = await page.locator("#primeiros-passos").isVisible();
    const apresentacao = page.locator("#apresentacao");
    checks.visualizar = await apresentacao.getByRole("link", { name: /visualizar/i }).isVisible();
    checks.download = await apresentacao.getByRole("link", { name: /download/i }).isVisible();

    await page.locator("#sobre").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "01-ajuda-real.png"), fullPage: false, timeout: 30000 });
    console.log("  ✓ 01-ajuda-real.png");

    for (const [id, file] of [
      ["workflow", "02-workflow-real.png"],
      ["apresentacao", "03-ppt-real.png"],
      ["ia", "04-ia-real.png"],
    ]) {
      const el = page.locator(`#${id}`);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await el.screenshot({ path: join(outDir, file) });
      console.log(`  ✓ ${file}`);
    }

    console.log("\n── Validação ──");
    for (const [key, ok] of Object.entries(checks)) {
      console.log(`  ${ok ? "✓" : "✗"} ${key}`);
    }

    const allOk = Object.values(checks).every(Boolean);
    if (!allOk) {
      process.exitCode = 1;
      console.error("\n✗ Validação incompleta\n");
    } else {
      console.log("\n✓ Todas as verificações passaram\n");
    }
  } finally {
    await Promise.race([
      browser.close(),
      new Promise((r) => setTimeout(r, 5000)),
    ]).catch(() => {});
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
