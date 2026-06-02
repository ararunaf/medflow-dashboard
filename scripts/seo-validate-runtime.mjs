#!/usr/bin/env node
/**
 * Validação SEO em runtime — metadata SSR, social preview, canonical, titles.
 */
const BASE = (process.argv.find((a) => a.startsWith("--url="))?.slice(6) ?? "http://localhost:4173").replace(
  /\/$/,
  "",
);

const ROUTES = [
  { path: "/site", expectTitle: /MedicFlow-AI/, requireOgImage: true, label: "Landing pública" },
  { path: "/login", expectTitle: /Entrar.*MedicFlow-AI/, requireOgImage: false, label: "Login" },
  { path: "/", expectTitle: /(Dashboard|MedicFlow-AI)/, requireOgImage: false, label: "Dashboard" },
];

const checks = [];
let exitCode = 0;

function ok(msg) {
  checks.push({ level: "ok", msg });
}
function fail(msg) {
  checks.push({ level: "error", msg });
  exitCode = 1;
}
function warn(msg) {
  checks.push({ level: "warn", msg });
}

function parseHtml(html) {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const parsed = {};
  for (const m of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attrs = m[1];
    const key =
      attrs.match(/\bproperty=["']([^"']+)["']/i)?.[1] ?? attrs.match(/\bname=["']([^"']+)["']/i)?.[1];
    const content = attrs.match(/\bcontent=["']([^"']*)["']/i)?.[1];
    if (key && content !== undefined) parsed[key] = content;
  }
  const canonical = [...html.matchAll(/<link\s+([^>]+)>/gi)]
    .map((x) => x[1])
    .filter((a) => /rel=["']canonical["']/i.test(a))
    .map((a) => a.match(/href=["']([^"']+)["']/i)?.[1])[0];
  return { title, parsed, canonical };
}

console.log(`\n[medflow] seo-validate-runtime → ${BASE}\n`);

for (const route of ROUTES) {
  console.log(`── ${route.label} (${route.path})\n`);
  try {
    const res = await fetch(`${BASE}${route.path}`, {
      headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "MedFlow-SEO-Validate/1.0" },
      redirect: "follow",
    });
    const html = await res.text();
    const { title, parsed, canonical } = parseHtml(html);

    if (!res.ok && res.status >= 400) fail(`${route.path} HTTP ${res.status}`);
    else ok(`${route.path} HTTP ${res.status}`);

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) fail(`${route.path} Content-Type não é HTML`);
    else ok(`${route.path} Content-Type text/html`);

    if (!/<html[^>]*lang=["']pt-BR["']/i.test(html)) fail(`${route.path} sem lang=pt-BR`);
    else ok(`${route.path} shell lang=pt-BR`);

    if (!title) fail(`${route.path} sem <title> no HTML SSR`);
    else if (!route.expectTitle.test(title)) fail(`${route.path} title inesperado: "${title}"`);
    else ok(`${route.path} title SSR: "${title}"`);

    if (!parsed.description) warn(`${route.path} sem meta description`);
    else ok(`${route.path} description: ${parsed.description.slice(0, 60)}…`);

    if (canonical) ok(`${route.path} canonical: ${canonical}`);
    else warn(`${route.path} sem <link rel="canonical">`);

    const ogKeys = ["og:title", "og:description", "og:type", "og:image"];
    for (const k of ogKeys) {
      if (!parsed[k]) warn(`${route.path} sem ${k}`);
      else ok(`${route.path} ${k}`);
    }

    if (route.requireOgImage) {
      const img = parsed["og:image"];
      if (!img) fail(`${route.path} og:image obrigatório ausente`);
      else if (!/^https?:\/\//.test(img)) warn(`${route.path} og:image relativo (${img}) — crawlers preferem URL absoluta`);
      else ok(`${route.path} og:image absoluta`);
    }

    if (!parsed["twitter:card"]) warn(`${route.path} sem twitter:card`);
    else ok(`${route.path} twitter:card=${parsed["twitter:card"]}`);

    const metaInHead = /<head[\s\S]*?<\/head>/i.test(html);
    if (!metaInHead) warn(`${route.path} bloco <head> não detectado claramente`);
    else ok(`${route.path} metadados presentes no <head> (SSR)`);

    const emptyShell = /<body[^>]*>\s*<\/body>/i.test(html);
    if (emptyShell) fail(`${route.path} body vazio — possível CSR-only`);
  } catch (err) {
    fail(`${route.path} → ${err instanceof Error ? err.message : String(err)}`);
  }
  console.log("");
}

console.log("── Assets OG (public)\n");
const { existsSync } = await import("node:fs");
const { join, dirname } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ogPath = join(root, "public", "icons", "opengraph", "og-default.png");
if (existsSync(ogPath)) ok("public/icons/opengraph/og-default.png presente");
else fail("public/icons/opengraph/og-default.png ausente");

console.log("\n── Código-fonte (canonical em rotas)\n");
const { readFileSync, readdirSync } = await import("node:fs");
function walkRoutes(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkRoutes(p, acc);
    else if (/\.tsx$/.test(name.name)) acc.push(p);
  }
  return acc;
}
const routesDir = join(root, "src", "routes");
let withHead = 0;
let withCanonical = 0;
for (const f of walkRoutes(routesDir)) {
  const t = readFileSync(f, "utf8");
  if (/\bhead:\s*\(/.test(t) || /\bhead:\s*\{/.test(t)) withHead++;
  if (/canonical/i.test(t)) withCanonical++;
}
ok(`${withHead} rota(s) com head() definido`);
if (withCanonical === 0) warn("Nenhuma rota define rel=canonical no head() — pendência SEO");
else ok(`${withCanonical} rota(s) com canonical`);

for (const c of checks) {
  const icon = c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "✗";
  console.log(`  ${icon} ${c.msg}`);
}

console.log(exitCode === 0 ? "\n✓ seo-validate-runtime OK\n" : "\n✗ seo-validate-runtime com pendências\n");
process.exit(exitCode);
