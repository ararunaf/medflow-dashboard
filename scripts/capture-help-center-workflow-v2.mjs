#!/usr/bin/env node
/**
 * Captura evidências HELP-CENTER-03C — workflow executivo v2 (staging autenticado).
 * Uso: node scripts/capture-help-center-workflow-v2.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots", "help-center-workflow-v2");
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
  console.log(`\n[medflow] Help center workflow v2 — ${BASE_URL}/ajuda\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  try {
    const session = await getSupabaseSession();
    await context.addCookies([sessionToAuthCookie(session)]);

    await page.goto(`${BASE_URL}/ajuda`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(4000);

    if (page.url().includes("/login")) {
      throw new Error("Redirecionado para login — sessão não aplicada");
    }

    const workflow = page.locator("#workflow");
    await workflow.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await workflow.screenshot({ path: join(outDir, "workflow-preview.png") });
    console.log("  ✓ workflow-preview.png");

    await workflow.getByRole("button", { name: "Ampliar", exact: true }).click();
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outDir, "workflow-lightbox.png") });
    console.log("  ✓ workflow-lightbox.png");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    const downloadLink = workflow.getByRole("link", { name: "Download", exact: true });
    const href = await downloadLink.getAttribute("href");
    const downloadAttr = await downloadLink.getAttribute("download");
    console.log(`  ✓ Download href: ${href}`);
    console.log(`  ✓ Download filename: ${downloadAttr}`);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
      downloadLink.click(),
    ]);

    if (download) {
      const suggested = download.suggestedFilename();
      console.log(`  ✓ Arquivo baixado: ${suggested}`);
      if (suggested !== "Fluxo Operacional Completo MedicFlow.png") {
        console.warn(`  ⚠ Nome do download esperado difere: ${suggested}`);
      }
    } else if (downloadAttr !== "Fluxo Operacional Completo MedicFlow.png") {
      console.warn(`  ⚠ Atributo download: ${downloadAttr}`);
    }

    await workflow.screenshot({ path: join(outDir, "workflow-download.png") });
    console.log("  ✓ workflow-download.png");

    console.log(`\nScreenshots saved to ${outDir}\n`);
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
