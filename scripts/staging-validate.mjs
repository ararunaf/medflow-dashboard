#!/usr/bin/env node
/**
 * Validação consolidada de staging — env, build client+SSR, rotas, assets e lazy loading.
 * Uso: npm run staging-validate
 *      npm run staging-validate:fast   (pula build, valida dist existente)
 *      npm run staging-validate -- --allow-placeholders  (só build/artefatos, ignora placeholders no .env.staging)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStagingEnvFiles } from "./lib/env-files.mjs";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { STAGING_APP_URL } from "./lib/staging-domain.mjs";
import { validateStagingBuild } from "./lib/validate-staging-build.mjs";
import { validatePwa } from "./lib/validate-pwa.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skipBuild = process.argv.includes("--skip-build");
const allowPlaceholders = process.argv.includes("--allow-placeholders");

loadEnvFiles(root, getStagingEnvFiles());

let exitCode = 0;

console.log("\n[medflow] staging-validate — build staging (client + SSR)\n");

function section(title) {
  console.log(`── ${title}`);
}

section("Variáveis de ambiente (.env.staging)");
const envResult = validateEnv({ production: true, staging: true });
const placeholderOnly =
  envResult.errors.length > 0 && envResult.errors.every((e) => e.includes("placeholder"));
const env = allowPlaceholders
  ? {
      ...envResult,
      errors: envResult.errors.filter((e) => !e.includes("placeholder")),
      ok: envResult.errors.filter((e) => !e.includes("placeholder")).length === 0,
    }
  : envResult;
if (allowPlaceholders && placeholderOnly) {
  console.log("  ! Placeholders em .env.staging ignorados (--allow-placeholders)");
}
for (const e of env.errors) {
  console.log(`  ✗ ${e}`);
  exitCode = 1;
}
for (const w of env.warnings) console.log(`  ! ${w}`);
if (env.ok) console.log("  ✓ Variáveis obrigatórias OK para staging");

if (!skipBuild) {
  section("Build staging (vite --mode staging → client + ssr)");
  const build = spawnSync("npm", ["run", "build:staging"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (build.status !== 0) {
    console.log("\n  ✗ npm run build:staging falhou\n");
    process.exit(1);
  }
  console.log("\n  ✓ build:staging OK (client + SSR)\n");
} else {
  console.log("\n  (build ignorado — use sem --skip-build ou rode build:staging antes)\n");
}

section("Artefatos, assets, rotas e code-splitting");
const artifacts = validateStagingBuild(root);
for (const p of artifacts.passes) console.log(`  ✓ ${p}`);
for (const w of artifacts.warnings) console.log(`  ! ${w}`);
for (const e of artifacts.errors) {
  console.log(`  ✗ ${e}`);
  exitCode = 1;
}

section("PWA (manifest, ícones, splash, nome)");
const pwa = validatePwa(root, { dist: true });
for (const p of pwa.passes) console.log(`  ✓ ${p}`);
for (const w of pwa.warnings) console.log(`  ! ${w}`);
for (const e of pwa.errors) {
  console.log(`  ✗ ${e}`);
  exitCode = 1;
}

section("SSR (padrões estáticos)");
const ssrArgs = ["--skip-build"];
const ssr = spawnSync(process.execPath, [join(root, "scripts", "ssr-validate.mjs"), ...ssrArgs], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (ssr.status !== 0) exitCode = 1;

section("Próximos passos");
console.log("  1. Preencha .env.staging com credenciais reais do projeto Supabase staging");
console.log("  2. npm run env-check:staging");
console.log("  3. npm run build:staging && wrangler deploy (manual, após revisão)");
console.log(
  `  4. Smoke HTTP: npm run smoke-check -- --url=${STAGING_APP_URL}  (paths: ${artifacts.smokePaths.join(", ")})\n`,
);

console.log(
  exitCode === 0
    ? "✓ staging-validate OK\n"
    : "✗ staging-validate com pendências (corrija .env.staging ou artefatos acima)\n",
);
process.exit(exitCode);
