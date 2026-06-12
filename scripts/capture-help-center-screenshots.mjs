#!/usr/bin/env node
/**
 * Captura screenshots da Central de Ajuda institucional (HELP-CENTER-01).
 * Usa preview estático local (build + fixture) para não depender de auth Supabase.
 *
 * Uso: node scripts/capture-help-center-screenshots.mjs
 */
import { createServer } from "node:http";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "screenshots", "help-center");
const distClient = join(root, "dist", "client");
const fixtureSrc = join(__dirname, "fixtures", "help-center-preview.html");
const fixtureDest = join(distClient, "help-center-preview.html");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ico": "image/x-icon",
  ".json": "application/json",
};

function contentType(path) {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME[ext] ?? "application/octet-stream";
}

function startStaticServer(port) {
  copyFileSync(fixtureSrc, fixtureDest);
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel === "/ajuda") rel = "/help-center-preview.html";
    const filePath = join(distClient, rel.replace(/^\//, "").replace(/\.\./g, ""));
    try {
      const data = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const port = 4177;
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = await startStaticServer(port);
  console.log(`\n[medflow] Help center screenshots — ${baseUrl}/ajuda\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto(`${baseUrl}/ajuda`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector("#sobre", { timeout: 30000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: join(outDir, "01-ajuda-overview.png"), fullPage: true });
    console.log("  ✓ 01-ajuda-overview.png");

    for (const [id, file] of [
      ["workflow", "02-ajuda-workflow.png"],
      ["apresentacao", "03-ajuda-ppt-card.png"],
      ["ia", "04-ajuda-ia.png"],
    ]) {
      const el = page.locator(`#${id}`);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await el.screenshot({ path: join(outDir, file) });
      console.log(`  ✓ ${file}`);
    }

    console.log(`\nScreenshots saved to ${outDir}\n`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
