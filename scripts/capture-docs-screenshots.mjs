#!/usr/bin/env node
/**
 * Captura screenshots para documentação corporativa.
 * Uso: node scripts/capture-docs-screenshots.mjs [--base-url=URL]
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

/** Telas solicitadas na auditoria — mapeadas para rotas reais. */
const screens = [
  { file: "01-login.png", path: "/login", auth: false, label: "Login" },
  { file: "02-dashboard.png", path: "/", auth: true, label: "Dashboard" },
  { file: "03-agenda-escalas.png", path: "/escalas", auth: true, label: "Agenda (Escalas)" },
  { file: "04-plantoes.png", path: "/plantoes", auth: true, label: "Plantões" },
  { file: "05-financeiro.png", path: "/financeiro", auth: true, label: "Financeiro" },
  {
    file: "06-relatorios-dashboard-executivo.png",
    path: "/financeiro/dashboard-executivo",
    auth: true,
    label: "Relatórios (Dashboard Executivo)",
  },
  { file: "07-configuracoes-instituicao.png", path: "/instituicao", auth: true, label: "Configurações (Instituição)" },
  { file: "08-administracao-piloto.png", path: "/piloto", auth: true, label: "Administração (Piloto)" },
  { file: "09-tiss.png", path: "/tiss", auth: true, label: "TISS" },
  { file: "10-perfil.png", path: "/perfil", auth: true, label: "Perfil" },
  { file: "11-central-operacional.png", path: "/central", auth: true, label: "Central Operacional" },
  { file: "12-ajuda.png", path: "/ajuda", auth: true, label: "Central de Ajuda" },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const tenantSelect = page.locator("select").first();
  if (await tenantSelect.isVisible().catch(() => false)) {
    const options = await tenantSelect.locator("option").all();
    for (const opt of options) {
      const val = await opt.getAttribute("value");
      if (val === LOGIN.tenantSlug) {
        await tenantSelect.selectOption(LOGIN.tenantSlug);
        break;
      }
    }
  }

  await page.getByLabel(/e-mail|email/i).fill(LOGIN.email);
  await page.getByLabel(/senha|password/i).fill(LOGIN.password);
  await page.getByRole("button", { name: /entrar|acessar|login/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function capture(page, screen) {
  await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  const target = join(outDir, screen.file);
  await page.screenshot({ path: target, fullPage: true });
  console.log(`  ✓ ${screen.label} → ${screen.file}`);
  return true;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`\n[medflow] Captura de screenshots — ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "pt-BR",
  });
  const page = await context.newPage();

  const results = { ok: [], fail: [] };

  try {
    await capture(page, screens[0]);
    results.ok.push(screens[0].file);

    await login(page);
    console.log("  ✓ Login autenticado");

    for (const screen of screens.slice(1)) {
      try {
        await capture(page, screen);
        results.ok.push(screen.file);
      } catch (err) {
        console.log(`  ✗ ${screen.label}: ${err?.message ?? err}`);
        results.fail.push({ ...screen, error: String(err?.message ?? err) });
      }
    }
  } catch (err) {
    console.error(`  ✗ Falha crítica: ${err?.message ?? err}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }

  console.log(`\n── Resumo: ${results.ok.length} capturas OK, ${results.fail.length} falhas`);
  if (results.fail.length) {
    for (const f of results.fail) console.log(`    - ${f.file}: ${f.error}`);
    process.exitCode = 1;
  }
}

main();
