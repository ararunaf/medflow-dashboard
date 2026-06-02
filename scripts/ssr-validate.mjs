#!/usr/bin/env node
/**
 * Validação SSR estática + artefatos de build (client + server).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src");
const skipBuild = process.argv.includes("--skip-build");

const checks = [];
let exitCode = 0;

function fail(msg) {
  checks.push({ level: "error", msg });
  exitCode = 1;
}
function warn(msg) {
  checks.push({ level: "warn", msg });
}
function pass(msg) {
  checks.push({ level: "ok", msg });
}

function lineUsesBrowserApi(line) {
  return /\bwindow\.|\bdocument\.|\blocalStorage\b|\bsessionStorage\b/.test(line);
}

function lineHasBrowserGuard(line) {
  return /typeof window|typeof document/.test(line);
}

/** Heurística: linha dentro de useEffect / useLayoutEffect / handler de evento. */
function isLikelyClientOnlyContext(lines, index) {
  const windowStart = Math.max(0, index - 12);
  const chunk = lines.slice(windowStart, index + 1).join("\n");
  return /useEffect\s*\(|useLayoutEffect\s*\(|onClick|onChange|onKeyDown|addEventListener/.test(chunk);
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === "dist") continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(name.name)) acc.push(p);
  }
  return acc;
}

console.log("\n[medflow] ssr-validate\n");

if (!skipBuild) {
  console.log("── Build (client + SSR)\n");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (build.status !== 0) {
    fail("npm run build falhou");
    process.exit(1);
  }
  pass("npm run build OK");
}

const clientDir = join(root, "dist", "client");
const serverDir = join(root, "dist", "server");

if (!existsSync(clientDir)) fail("dist/client ausente");
else pass("dist/client presente");

if (!existsSync(serverDir)) fail("dist/server ausente");
else pass("dist/server presente");

const serverEntry = join(serverDir, "index.js");
if (!existsSync(serverEntry)) fail("dist/server/index.js ausente");
else pass("dist/server/index.js presente");

console.log("\n── Padrões SSR perigosos (src)\n");

const files = walk(src);
let hydrationIssues = 0;
let browserApiWarnings = 0;

for (const file of files) {
  const rel = file.replace(root + "\\", "").replace(root + "/", "");
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    if (/useState\(\s*\(\)\s*=>\s*[^)]*(localStorage|sessionStorage)/.test(line)) {
      fail(`${rel}:${i + 1} [hydration] useState initializer lê storage`);
      hydrationIssues++;
    }

    if (!lineUsesBrowserApi(line) || lineHasBrowserGuard(line)) return;

    if (isLikelyClientOnlyContext(lines, i)) return;

    // Funções utilitárias com guard no topo do arquivo
    if (/export function read|export function write|export function is|export function set/.test(text)) {
      const fnChunk = text.slice(0, text.indexOf(line));
      if (/typeof window === ["']undefined["']/.test(fnChunk.slice(-800))) return;
    }

    warn(`${rel}:${i + 1} [review] API de browser — confirmar guard ou client-only`);
    browserApiWarnings++;
  });
}

if (hydrationIssues === 0) pass("Nenhum useState com storage no initializer");
if (browserApiWarnings > 0) {
  pass(`${browserApiWarnings} uso(s) de browser API para revisão manual (handlers/effects OK)`);
}

for (const c of checks) {
  const icon = c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "✗";
  console.log(`  ${icon} ${c.msg}`);
}

console.log(
  exitCode === 0
    ? "\n✓ ssr-validate OK\n"
    : "\n✗ ssr-validate com pendências (revise itens acima)\n",
);
process.exit(exitCode);
