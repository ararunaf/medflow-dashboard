#!/usr/bin/env node
/**
 * Captura screenshots da Sprint IA-Visível em staging.
 * Uso: node scripts/capture-ia-screenshots.mjs [--base-url=URL]
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
  console.log(`\n[medflow] Captura IA-Visível — ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  try {
    await login(page);
    console.log("  ✓ Login autenticado (manager)");

    // Screenshot 1 — Menu lateral com Central de IA
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2500);
    const menuItem = page.getByRole("link", { name: /Central de IA/i });
    if (await menuItem.isVisible().catch(() => false)) {
      await menuItem.scrollIntoViewIfNeeded();
    }
    await page.screenshot({
      path: join(outDir, "12-menu-central-ia.png"),
      clip: { x: 0, y: 0, width: 420, height: 1080 },
    });
    console.log("  ✓ 12-menu-central-ia.png");

    // Screenshot 2 — Dashboard com card IA Operacional
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2500);
    const iaCard = page.getByText(/IA Operacional/i).first();
    if (await iaCard.isVisible().catch(() => false)) {
      await iaCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(outDir, "13-dashboard-ia-card.png"),
      fullPage: false,
    });
    console.log("  ✓ 13-dashboard-ia-card.png");

    // Screenshot 3 — Central de IA Operacional (full page)
    await page.goto(`${BASE_URL}/central`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: join(outDir, "14-central-ia-operacional.png"),
      fullPage: true,
    });
    console.log("  ✓ 14-central-ia-operacional.png");

    // Screenshot 4 — Copilot no topo (viewport inicial)
    await page.goto(`${BASE_URL}/central`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    const copilot = page.getByText(/Copiloto operacional/i).first();
    if (await copilot.isVisible().catch(() => false)) {
      await copilot.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: join(outDir, "15-copilot-topo.png"),
      fullPage: false,
    });
    console.log("  ✓ 15-copilot-topo.png");

    console.log("\n── 4 screenshots IA capturados com sucesso\n");
  } catch (err) {
    console.error(`  ✗ Falha: ${err?.message ?? err}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
