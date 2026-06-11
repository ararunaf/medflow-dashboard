#!/usr/bin/env node
/** Render local fixture do calendário Escalas (jun/2026) para evidência visual. */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outFile = join(root, "docs", "screenshots", "20-escalas-mes-dinamico.png");

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function buildDays() {
  const out = [];
  const today = new Date(2026, 5, 11);
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({ day: d.getDate(), month: MONTHS[d.getMonth()], isToday: i === 0 });
  }
  return out;
}

const days = buildDays();
const buttons = days
  .map((d) => {
    const active = d.isToday
      ? "background:#1e3a5f;color:#fff;"
      : "background:#f1f5f9;color:#0f172a;";
    return `<button style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:48px;height:64px;border-radius:8px;font-size:12px;border:none;${active}">
      <span style="opacity:.7">${d.isToday ? "Hoje" : d.month}</span>
      <span style="font-size:16px;font-weight:600">${d.day}</span>
    </button>`;
  })
  .join("");

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Escalas — MedicFlow-AI</title></head>
<body style="font-family:Inter,system-ui,sans-serif;padding:32px;background:#f8fafc;margin:0">
  <div style="max-width:960px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
    <h1 style="font-size:28px;margin:0 0 4px;color:#0f172a">Escalas</h1>
    <p style="color:#64748b;margin:0 0 20px">Próximos 14 dias</p>
    <div style="display:flex;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;overflow-x:auto">
      ${buttons}
    </div>
    <p style="color:#64748b;margin-top:32px;text-align:center">Sem plantões nesta data</p>
  </div>
</body></html>`;

mkdirSync(dirname(outFile), { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.setContent(html);
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

const allJun = days.filter((d) => !d.isToday).every((d) => d.month === "Jun");
console.log(`✓ Fixture salvo: docs/screenshots/20-escalas-mes-dinamico.png (Jun=${allJun})`);
