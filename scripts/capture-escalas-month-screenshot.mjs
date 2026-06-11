#!/usr/bin/env node
/**
 * Captura screenshot do calendário Escalas com mês dinâmico.
 * Uso: node scripts/capture-escalas-month-screenshot.mjs [--base-url=URL]
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots");
const outFile = join(outDir, "20-escalas-mes-dinamico.png");

const baseUrlArg = process.argv.find((a) => a.startsWith("--base-url="));
const BASE_URL = (baseUrlArg?.slice(11) ?? "https://staging.medicflow.app.br").replace(/\/$/, "");

const LOGIN = {
  tenantSlug: "medflow-admin",
  email: "admin@iaeasy.com.br",
  password: "@Myson3sgm",
};

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const tenantSelect = page.locator("select").first();
  if (await tenantSelect.isVisible().catch(() => false)) {
    await tenantSelect.selectOption(LOGIN.tenantSlug).catch(async () => {
      const options = await tenantSelect.locator("option").all();
      for (const opt of options) {
        const val = await opt.getAttribute("value");
        if (val === LOGIN.tenantSlug) {
          await tenantSelect.selectOption(LOGIN.tenantSlug);
          break;
        }
      }
    });
  }

  await page.getByLabel(/e-mail|email/i).fill(LOGIN.email);
  await page.getByLabel(/senha|password/i).fill(LOGIN.password);
  await page.getByRole("button", { name: /entrar|acessar|login/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[escalas] Captura → ${outFile}\n  base: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
  });

  try {
    await login(page);
    await page.goto(`${BASE_URL}/escalas`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: outFile, fullPage: true });
    console.log(`  ✓ Screenshot salvo: docs/screenshots/20-escalas-mes-dinamico.png`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
