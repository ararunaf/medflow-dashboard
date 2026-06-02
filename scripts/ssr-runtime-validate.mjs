#!/usr/bin/env node
/**
 * Validação SSR em runtime — simula F5 (GET document), hydration markers,
 * preload (router), pending fallback, e lazy chunks no client.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BASE = (process.argv.find((a) => a.startsWith("--url="))?.slice(6) ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

const ROUTES = [
  { path: "/site", expectInBody: ["MedicFlow", "html"], titleHint: "MedicFlow" },
  { path: "/login", expectInBody: ["Entrar", "html"], titleHint: "Entrar" },
  { path: "/health", expectJson: true },
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

async function fetchDocument(path, { followRedirects = true } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "MedFlow-SSR-Validate/1.0",
    },
    redirect: followRedirects ? "follow" : "manual",
  });
  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();
  return { res, contentType, body };
}

function walkSuspense(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules" || name.name === "dist") continue;
      walkSuspense(p, acc);
    } else if (/\.(tsx|ts)$/.test(name.name)) {
      const t = readFileSync(p, "utf8");
      if (/\bSuspense\b/.test(t)) acc.push(p.replace(root + "\\", "").replace(root + "/", ""));
    }
  }
  return acc;
}

console.log(`\n[medflow] ssr-runtime-validate → ${BASE}\n`);

// ── 1. F5 / full document request (SSR HTML) ──
console.log("── F5 refresh (GET document, Accept: text/html)\n");

for (const route of ROUTES) {
  try {
    const { res, contentType, body } = await fetchDocument(route.path);

    if (route.expectJson) {
      if (res.status === 200) ok(`${route.path} → ${res.status} JSON`);
      else if (res.status === 503) warn(`${route.path} → HTTP 503 (health indisponível em dev — OK em deploy)`);
      else fail(`${route.path} → HTTP ${res.status}`);
      continue;
    }

    if (res.status >= 500) {
      fail(`${route.path} → HTTP ${res.status} (erro servidor)`);
      continue;
    }
    if (res.status >= 400 && res.status !== 302 && res.status !== 307) {
      warn(`${route.path} → HTTP ${res.status} (pode ser redirect de auth)`);
    } else {
      ok(`${route.path} → HTTP ${res.status}`);
    }

    if (!contentType.includes("text/html")) {
      fail(`${route.path} Content-Type não é HTML: ${contentType}`);
    } else {
      ok(`${route.path} Content-Type text/html`);
    }

    const hasShell = /<html[^>]*lang=["']pt-BR["']/i.test(body) && /<body/i.test(body);
    if (!hasShell) fail(`${route.path} shell HTML incompleto (html/body)`);
    else ok(`${route.path} shell SSR (html lang=pt-BR + body)`);

    for (const needle of route.expectInBody) {
      if (!body.includes(needle)) {
        fail(`${route.path} corpo SSR sem "${needle}"`);
      }
    }
    if (route.expectInBody.every((n) => body.includes(n))) {
      ok(`${route.path} conteúdo renderizado no HTML (${route.expectInBody.join(", ")})`);
    }

    const cache = res.headers.get("cache-control") ?? "";
    if (cache.toLowerCase().includes("no-store") || cache.toLowerCase().includes("private")) {
      ok(`${route.path} Cache-Control adequado para SSR (${cache.slice(0, 48)})`);
    } else if (cache) {
      warn(`${route.path} Cache-Control: ${cache}`);
    }
  } catch (err) {
    fail(`${route.path} → ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── 2. Hydration markers (TanStack Start / React) ──
console.log("\n── Hydration (dehydrated state + client scripts)\n");

try {
  const { body } = await fetchDocument("/site");

  const hasScripts = /<script/i.test(body);
  const hasModule =
    /<script[^>]+type=["']module["']/i.test(body) || /import\(/i.test(body) || /\.js["']/i.test(body);
  const dehydrated =
    /dehydrat/i.test(body) ||
    /__TSR_/i.test(body) ||
    /routerState/i.test(body) ||
    /"router"/i.test(body) ||
    /tanstack/i.test(body);

  if (!hasScripts) fail("/site sem tags <script> (client bundle)");
  else ok("/site inclui scripts do cliente");

  if (!hasModule) warn("/site: script type=module não detectado (pode estar inline)");
  else ok("/site scripts module/asset detectados");

  if (!dehydrated) {
    warn(
      "/site: marcador explícito de dehydrate não encontrado — TanStack Start pode embutir estado de outra forma",
    );
  } else {
    ok("/site marcadores de estado/router para hidratação detectados");
  }

  const emptyRoot = /<div id=["']root["']>\s*<\/div>/i.test(body);
  if (emptyRoot) fail("/site root vazio — possível CSR-only (sem SSR de conteúdo)");
  else ok("/site não é shell vazio (conteúdo no HTML)");
} catch (err) {
  fail(`hydration check → ${err instanceof Error ? err.message : String(err)}`);
}

// ── 3. Route preload (router config + Link preload) ──
console.log("\n── Route preload (config + artefatos)\n");

const routerSrc = readFileSync(join(root, "src", "router.tsx"), "utf8");
if (routerSrc.includes("defaultPreloadStaleTime")) {
  ok("router.tsx define defaultPreloadStaleTime (preload TanStack Router)");
} else {
  fail("router.tsx sem defaultPreloadStaleTime");
}

const rootSrc = readFileSync(join(root, "src", "routes", "__root.tsx"), "utf8");
if (rootSrc.includes("pendingComponent")) {
  ok("__root.tsx pendingComponent → fallback durante preload/navegação");
} else {
  fail("__root.tsx sem pendingComponent");
}

const appShell = readFileSync(join(root, "src", "components", "app-shell.tsx"), "utf8");
const linkPreload = (appShell.match(/<Link[^>]*preload/gi) ?? []).length;
const prefetch = (appShell.match(/preload:\s*['"]intent['"]/g) ?? []).length;
if (linkPreload + prefetch > 0) {
  ok(`app-shell Link preload/intent: ${linkPreload + prefetch} ocorrência(s)`);
} else {
  warn("app-shell: nenhum Link com preload explícito — preload usa defaults do router");
}

// ── 4. Suspense ──
console.log("\n── Suspense\n");

const suspenseFiles = walkSuspense(join(root, "src"));
if (suspenseFiles.length === 0) {
  warn("Nenhum React.Suspense no src — loading via pendingComponent + loaders (padrão TanStack)");
} else {
  ok(
    `Suspense em ${suspenseFiles.length} arquivo(s): ${suspenseFiles.slice(0, 3).join(", ")}${suspenseFiles.length > 3 ? "…" : ""}`,
  );
}

// ── 5. Lazy loading (code-split por rota) ──
console.log("\n── Lazy loading (chunks client)\n");

const clientAssets = join(root, "dist", "client", "assets");
if (!existsSync(clientAssets)) {
  warn("dist/client/assets ausente — rode npm run build para validar chunks");
} else {
  const jsFiles = readdirSync(clientAssets).filter((f) => f.endsWith(".js"));
  const routeSegments = ["login", "site", "central", "tiss", "piloto", "index"];
  let split = 0;
  for (const seg of routeSegments) {
    if (jsFiles.some((f) => f.startsWith(`${seg}-`))) split++;
  }
  if (split >= 4) {
    ok(`Code-splitting: ${split}/${routeSegments.length} rotas com chunk dedicado no client`);
  } else {
    fail(`Poucos chunks por rota (${split}/${routeSegments.length})`);
  }
  ok(`${jsFiles.length} chunks JS no client (lazy routes + vendors)`);
}

for (const c of checks) {
  const icon = c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "✗";
  console.log(`  ${icon} ${c.msg}`);
}

console.log(
  exitCode === 0
    ? "\n✓ ssr-runtime-validate OK\n"
    : "\n✗ ssr-runtime-validate com falhas\n",
);
process.exit(exitCode);
