import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { auditClientBundleBranding } from "./branding-audit.mjs";
import { STAGING_APP_HOST, STAGING_APP_URL } from "./staging-domain.mjs";
import {
  FORBIDDEN_STAGING_BUNDLE_PATTERNS,
  STAGING_SUPABASE_HOST,
  STAGING_SUPABASE_URL,
} from "./staging-supabase.mjs";

/** URLs de dev local do MedFlow — não devem aparecer em build staging. */
const MEDFLOW_DEV_URL_IN_BUNDLE = /https?:\/\/(?:localhost|127\.0\.0\.1):8080\b/i;
const VENDOR_CHUNK_PREFIXES = ["supabase-", "tanstack-", "vendor-", "icons-"];
const STAGING_HOST_IN_BUNDLE = STAGING_APP_HOST;

/** Rotas públicas mínimas para smoke pós-deploy (alinhado a smoke-check.mjs). */
export const STAGING_SMOKE_PATHS = ["/site", "/login"];

/**
 * Valida artefatos pós `npm run build:staging` (client + SSR + rotas + assets + chunks).
 */
export function validateStagingBuild(cwd) {
  const errors = [];
  const warnings = [];
  const passes = [];

  const clientDir = join(cwd, "dist", "client");
  const serverDir = join(cwd, "dist", "server");
  const clientAssets = join(clientDir, "assets");
  const serverAssets = join(serverDir, "assets");

  if (!existsSync(clientDir)) errors.push("dist/client ausente — rode npm run build:staging");
  else passes.push("dist/client presente");

  if (!existsSync(serverDir)) errors.push("dist/server ausente — rode npm run build:staging");
  else passes.push("dist/server presente");

  const serverEntry = join(serverDir, "index.js");
  if (!existsSync(serverEntry)) errors.push("dist/server/index.js ausente (entry SSR/Worker)");
  else passes.push("dist/server/index.js presente");

  const wrangler = join(serverDir, "wrangler.json");
  if (!existsSync(wrangler)) warnings.push("dist/server/wrangler.json ausente — confira deploy Workers");
  else passes.push("dist/server/wrangler.json presente");

  const listAssets = (dir) =>
    existsSync(dir) ? readdirSync(dir) : [];

  const clientFiles = listAssets(clientAssets);
  const serverFiles = listAssets(serverAssets);

  const logoPattern = /^logo-medicflow-ai-.+\.png$/i;
  const logoClient = clientFiles.find((f) => logoPattern.test(f));
  const logoServer = serverFiles.find((f) => logoPattern.test(f));
  if (!logoClient) errors.push("Asset logo-medicflow-ai.png ausente em dist/client/assets");
  else passes.push("Asset logo (client) presente");
  if (!logoServer) errors.push("Asset logo-medicflow-ai.png ausente em dist/server/assets");
  else passes.push("Asset logo (SSR) presente");

  const manifestClient = join(clientDir, "manifest.webmanifest");
  const manifestJsonClient = join(clientDir, "manifest.json");
  if (!existsSync(manifestClient)) {
    errors.push("public/manifest.webmanifest ausente em dist/client");
  } else passes.push("PWA manifest presente no client");
  if (!existsSync(manifestJsonClient)) {
    errors.push("public/manifest.json ausente em dist/client");
  } else passes.push("PWA manifest.json presente no client");

  const faviconClient = join(clientDir, "favicon.ico");
  if (!existsSync(faviconClient)) {
    warnings.push("public/favicon.ico ausente em dist/client");
  } else passes.push("Favicon público presente no client");

  const cssClient = clientFiles.find((f) => f.endsWith(".css"));
  if (!cssClient) warnings.push("Nenhum bundle CSS em dist/client/assets");
  else passes.push("Bundle CSS (client) presente");

  const vendorChunks = ["tanstack", "supabase", "icons", "vendor"];
  for (const name of vendorChunks) {
    const hit = clientFiles.some((f) => f.startsWith(`${name}-`) && f.endsWith(".js"));
    if (!hit) warnings.push(`Chunk manualChunks "${name}" não encontrado no client`);
    else passes.push(`Chunk vendor "${name}" presente`);
  }

  const routeTreePath = join(cwd, "src", "routeTree.gen.ts");
  if (!existsSync(routeTreePath)) {
    errors.push("src/routeTree.gen.ts ausente — gere rotas (dev/build)");
  } else {
    const tree = readFileSync(routeTreePath, "utf8");
    const paths = [...tree.matchAll(/^\s+'([^']+)': typeof \w+Route/gm)].map((m) => m[1]);
    const uniquePaths = [...new Set(paths)].filter((p) => p.startsWith("/"));

    if (uniquePaths.length < 10) {
      warnings.push(`Poucas rotas em routeTree (${uniquePaths.length}) — confira geração`);
    } else {
      passes.push(`${uniquePaths.length} rotas registradas em routeTree.gen.ts`);
    }

    const jsChunks = clientFiles.filter((f) => f.endsWith(".js"));
    let missingRouteChunks = 0;
    for (const fullPath of uniquePaths) {
      const segment =
        fullPath === "/"
          ? "index"
          : fullPath
              .slice(1)
              .replace(/\//g, ".")
              .split(".")
              .pop();
      const hasChunk = jsChunks.some((f) => f.startsWith(`${segment}-`) || f.includes(`${segment}-`));
      if (!hasChunk && fullPath !== "/financeiro") {
        missingRouteChunks++;
        warnings.push(`Chunk client para rota ${fullPath} (${segment}) não detectado — pode estar no bundle principal`);
      }
    }
    if (missingRouteChunks === 0) {
      passes.push("Chunks por rota detectados no client (code-splitting)");
    } else {
      passes.push(
        `Code-splitting: ${uniquePaths.length - missingRouteChunks}/${uniquePaths.length} rotas com chunk dedicado`,
      );
    }
  }

  const indexHtml = join(clientDir, "index.html");
  if (!existsSync(indexHtml)) {
    warnings.push("dist/client/index.html ausente (TanStack Start pode servir só via SSR)");
  }

  if (existsSync(logoClient) && existsSync(clientAssets)) {
    const size = statSync(join(clientAssets, logoClient)).size;
    if (size > 500_000) {
      warnings.push(
        `logo-medicflow-ai.png ~${Math.round(size / 1024)}KB — considere otimizar para staging/prod`,
      );
    }
  }

  const scanJsForMedflowDevUrl = (dir, label) => {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      if (VENDOR_CHUNK_PREFIXES.some((p) => file.startsWith(p))) continue;
      const content = readFileSync(join(dir, file), "utf8");
      if (MEDFLOW_DEV_URL_IN_BUNDLE.test(content)) {
        errors.push(
          `${label}: URL de dev local (localhost:8080) em ${file} — use ${STAGING_APP_URL} no build`,
        );
      }
    }
  };
  scanJsForMedflowDevUrl(clientAssets, "dist/client/assets");
  scanJsForMedflowDevUrl(serverAssets, "dist/server/assets");

  const bundleContains = (dir, needle) => {
    if (!existsSync(dir)) return false;
    return readdirSync(dir).some((file) => {
      if (!file.endsWith(".js")) return false;
      return readFileSync(join(dir, file), "utf8").includes(needle);
    });
  };

  const clientHasStagingHost = bundleContains(clientAssets, STAGING_HOST_IN_BUNDLE);
  const serverHasStagingHost = bundleContains(serverAssets, STAGING_HOST_IN_BUNDLE);
  if (clientHasStagingHost) {
    passes.push(`Domínio staging (${STAGING_APP_URL}) presente no bundle client`);
  } else {
    errors.push(
      `Domínio ${STAGING_APP_HOST} ausente em dist/client/assets — confira VITE_MEDFLOW_APP_URL e use npm run build:staging`,
    );
  }
  if (serverHasStagingHost) {
    passes.push(`Domínio staging (${STAGING_APP_URL}) presente no bundle SSR`);
  } else {
    errors.push(
      `Domínio ${STAGING_APP_HOST} ausente em dist/server/assets — confira VITE_MEDFLOW_APP_URL e use npm run build:staging`,
    );
  }

  const clientHasStagingSupabase = bundleContains(clientAssets, STAGING_SUPABASE_HOST);
  const serverHasStagingSupabase = bundleContains(serverAssets, STAGING_SUPABASE_HOST);
  if (clientHasStagingSupabase) {
    passes.push(`Supabase staging (${STAGING_SUPABASE_URL}) presente no bundle client`);
  } else {
    errors.push(
      `Supabase staging (${STAGING_SUPABASE_HOST}) ausente em dist/client/assets — use npm run build:staging com .env.staging real`,
    );
  }
  if (serverHasStagingSupabase) {
    passes.push(`Supabase staging (${STAGING_SUPABASE_URL}) presente no bundle SSR`);
  } else {
    errors.push(
      `Supabase staging (${STAGING_SUPABASE_HOST}) ausente em dist/server/assets — use npm run build:staging com .env.staging real`,
    );
  }

  const markerPath = join(cwd, "dist", ".staging-build-marker.json");
  const bundleLooksLikeStaging =
    clientHasStagingHost && serverHasStagingHost && clientHasStagingSupabase && serverHasStagingSupabase;
  if (!existsSync(markerPath)) {
    errors.push(
      "dist/.staging-build-marker.json ausente — rode npm run build:staging (não npm run build) antes do deploy staging",
    );
  } else if (!bundleLooksLikeStaging) {
    errors.push(
      "Marcador staging inconsistente com o bundle — dist foi gerado por build production ou env incorreto; rode npm run build:staging",
    );
  } else {
    try {
      const marker = JSON.parse(readFileSync(markerPath, "utf8"));
      if (marker.mode !== "staging" || marker.viteMode !== "staging") {
        errors.push(
          `Marcador de build inválido (mode=${marker.mode}) — use npm run build:staging antes do deploy staging`,
        );
      } else if (marker.supabaseHost !== STAGING_SUPABASE_HOST) {
        errors.push(
          `Marcador staging com supabaseHost=${marker.supabaseHost} — esperado ${STAGING_SUPABASE_HOST}`,
        );
      } else {
        passes.push("Marcador dist/.staging-build-marker.json confirma build --mode staging");
      }
    } catch {
      errors.push("dist/.staging-build-marker.json ilegível — refaça npm run build:staging");
    }
  }

  const EMPTY_SUPABASE_ENV_IN_BUNDLE =
    /(?:url|anonKey|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*[:=]\s*["'`]{2}/i;
  const scanJsForForbiddenBundleContent = (dir, label) => {
    if (!existsSync(dir)) return;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".js")) continue;
      // Chunks vendor (@supabase, etc.) contêm JSDoc com example.com — não são env embutido.
      if (VENDOR_CHUNK_PREFIXES.some((p) => file.startsWith(p))) continue;
      const content = readFileSync(join(dir, file), "utf8");
      for (const rule of FORBIDDEN_STAGING_BUNDLE_PATTERNS) {
        if (rule.pattern.test(content)) {
          errors.push(
            `${label}: ${rule.id} detectado em ${file} — use npm run build:staging (não npm run build) antes do deploy staging`,
          );
        }
        rule.pattern.lastIndex = 0;
      }
      if (EMPTY_SUPABASE_ENV_IN_BUNDLE.test(content)) {
        errors.push(
          `${label}: variável Supabase vazia em ${file} — preencha .env.staging antes de npm run build:staging`,
        );
      }
    }
  };
  scanJsForForbiddenBundleContent(clientAssets, "dist/client/assets");
  scanJsForForbiddenBundleContent(serverAssets, "dist/server/assets");

  const brandingBundle = auditClientBundleBranding(cwd);
  if (!brandingBundle.skipped) {
    if (brandingBundle.ok) {
      passes.push("Bundle client sem marcas legadas MedFlow / MedFlow-IA");
    } else {
      for (const v of brandingBundle.violations) {
        errors.push(
          `Branding legado no bundle: ${v.file} (${v.samples.join(", ")}) — use MedicFlow-AI em UI/SEO`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    passes,
    smokePaths: STAGING_SMOKE_PATHS,
  };
}
