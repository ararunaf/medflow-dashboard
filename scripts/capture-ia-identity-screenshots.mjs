#!/usr/bin/env node
/**
 * Captura screenshots da Sprint IA-Identity em staging.
 * Uso: node scripts/capture-ia-identity-screenshots.mjs [--base-url=URL]
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots");

const baseUrlArg = process.argv.find((a) => a.startsWith("--base-url="));
const BASE_URL = (baseUrlArg?.slice(11) ?? "https://staging.medicflow.app.br").replace(/\/$/, "");

const LOGIN = {
  tenantSlug: "medflow-admin",
  email: "admin@iaeasy.com.br",
  password: "@Myson3sgm",
};

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(2000);

  const tenantSelect = page.locator("select").first();
  if (await tenantSelect.isVisible().catch(() => false)) {
    await tenantSelect.selectOption(LOGIN.tenantSlug).catch(() => {});
  }

  await page.getByLabel(/e-mail|email/i).fill(LOGIN.email);
  await page.getByLabel(/senha|password/i).fill(LOGIN.password);
  await page.getByRole("button", { name: /entrar|acessar|login/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 90000 });
  await page.waitForTimeout(3000);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[medflow] Captura IA-Identity — ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  try {
    await login(page);
    console.log("  ✓ Login autenticado (manager)");

    // 16 — Central de IA com badges Brain+IA
    await page.goto(`${BASE_URL}/central`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    const copilot = page.getByText(/Copiloto operacional/i).first();
    if (await copilot.isVisible().catch(() => false)) {
      await copilot.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(outDir, "16-central-ia-badges.png"),
      fullPage: false,
    });
    console.log("  ✓ 16-central-ia-badges.png");

    // 17 — Copilot GPT com badge IA
    await page.goto(`${BASE_URL}/central`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    const copilotPanel = page.locator("#ops-anchor-copilot-gpt");
    if (await copilotPanel.isVisible().catch(() => false)) {
      await copilotPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(outDir, "17-copilot-ia.png"),
      clip: { x: 240, y: 180, width: 1400, height: 520 },
    });
    console.log("  ✓ 17-copilot-ia.png");

    // 18 — Dashboard / Home com identidade IA
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2500);
    const iaCard = page.getByText(/IA Operacional/i).first();
    if (await iaCard.isVisible().catch(() => false)) {
      await iaCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(outDir, "18-dashboard-ia-identity.png"),
      fullPage: false,
    });
    console.log("  ✓ 18-dashboard-ia-identity.png");

    // 19 — Alertas + Recomendações com badges IA
    await page.goto(`${BASE_URL}/central`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    const alerts = page.getByText(/Alertas inteligentes/i).first();
    if (await alerts.isVisible().catch(() => false)) {
      await alerts.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    }
    await page.screenshot({
      path: join(outDir, "19-alertas-recomendacoes-ia.png"),
      clip: { x: 240, y: 120, width: 1400, height: 700 },
    });
    console.log("  ✓ 19-alertas-recomendacoes-ia.png");

    console.log("\n── 4 screenshots IA-Identity capturados com sucesso\n");
  } catch (err) {
    console.error(`  ✗ Falha: ${err?.message ?? err}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
