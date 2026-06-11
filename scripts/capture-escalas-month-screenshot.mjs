#!/usr/bin/env node
/**
 * Captura screenshot do calendário Escalas com mês dinâmico.
 * Uso: node scripts/capture-escalas-month-screenshot.mjs [--base-url=URL]
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots");
const outFile = join(outDir, "20-escalas-mes-dinamico.png");

const baseUrlArg = process.argv.find((a) => a.startsWith("--base-url="));
const BASE_URL = (baseUrlArg?.slice(11) ?? "https://staging.medicflow.app.br").replace(/\/$/, "");

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
  return { name, value, domain: host, path: "/", sameSite: "Lax", secure: true, httpOnly: false };
}

async function loginViaForm(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);

  const tenantSelect = page.locator("select").first();
  if (await tenantSelect.isVisible().catch(() => false)) {
    await tenantSelect.selectOption(LOGIN.tenantSlug).catch(() => undefined);
  }

  await page.getByLabel(/e-mail|email/i).fill(LOGIN.email);
  await page.getByLabel(/senha|password/i).fill(LOGIN.password);
  await page.getByRole("button", { name: /entrar|acessar|login/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 90000 });
  await page.waitForTimeout(2000);
}

async function ensureAuthenticated(page, context) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1500);
  if (!page.url().includes("/login")) return;

  try {
    const session = await getSupabaseSession();
    await context.addCookies([sessionToAuthCookie(session)]);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(2000);
  } catch {
    /* fallback abaixo */
  }

  if (page.url().includes("/login")) {
    await loginViaForm(page);
  }

  if (page.url().includes("/login")) {
    throw new Error(`Autenticação falhou — permanece em ${page.url()}`);
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[escalas] Captura → ${outFile}\n  base: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  try {
    await ensureAuthenticated(page, context);
    await page.goto(`${BASE_URL}/escalas`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(3000);

    const hasJun = await page.getByText(/^Jun$/).first().isVisible().catch(() => false);
    const hasMai = await page.getByText(/^Mai$/).first().isVisible().catch(() => false);
    console.log(`  calendário: Jun visível=${hasJun}, Mai visível=${hasMai}`);

    await page.screenshot({ path: outFile, fullPage: true, timeout: 45000 });
    console.log("  ✓ Screenshot salvo: docs/screenshots/20-escalas-mes-dinamico.png");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
