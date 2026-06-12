#!/usr/bin/env node
/**
 * Captura screenshots do login branding v2 (desktop, tablet, mobile).
 * Uso: node scripts/capture-login-branding-v2-screenshots.mjs [--base-url=URL]
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots", "login-branding-v2");

const baseUrlArg = process.argv.find((a) => a.startsWith("--base-url="));
const BASE_URL = (baseUrlArg?.slice(11) ?? "https://staging.medicflow.app.br").replace(/\/$/, "");

const VIEWPORTS = [
  { file: "login-desktop-v2.png", width: 1440, height: 900, label: "Desktop" },
  { file: "login-tablet-v2.png", width: 1024, height: 768, label: "Tablet" },
  { file: "login-mobile-v2.png", width: 390, height: 844, label: "Mobile" },
];

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[medflow] Login branding v2 screenshots — ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: "pt-BR",
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(2500);
    const target = join(outDir, vp.file);
    await page.screenshot({ path: target, fullPage: false });
    console.log(`  ✓ ${vp.label} → ${vp.file}`);
    await context.close();
  }

  await browser.close();
  console.log("\n✓ Captura concluída\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
