#!/usr/bin/env node
/**
 * Deploy staging hardened — único fluxo permitido para staging.medicflow.app.br.
 *
 * Sequência obrigatória (aborta em qualquer falha):
 *   1. env-check:staging
 *   2. build:staging (+ marcador de build)
 *   3. validate-staging-build
 *   4. wrangler deploy (ou --dry-run)
 *
 * Uso:
 *   npm run deploy:staging
 *   npm run deploy:staging:preview
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const dryRun = process.argv.includes("--dry-run");
const skipBuild = process.argv.includes("--skip-build");

function abort(step, exitCode) {
  console.error(
    `\n✗ deploy:staging ABORTADO — etapa "${step}" falhou (exit ${exitCode ?? 1}).\n` +
      "   Nenhum deploy foi publicado. Corrija env/build e tente novamente.\n",
  );
  process.exit(exitCode ?? 1);
}

function runStep(step, command, args) {
  console.log(`\n[deploy:staging] ${step}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) abort(step, result.status);
}

console.log("\n══════════════════════════════════════════════════════════════");
console.log("  deploy:staging — fluxo único e obrigatório para staging");
console.log("  Domínio: https://staging.medicflow.app.br");
console.log("══════════════════════════════════════════════════════════════\n");

runStep("1/4 env-check:staging", "npm", ["run", "env-check:staging"]);

if (skipBuild) {
  console.log("\n[deploy:staging] 2/4 build:staging — ignorado (--skip-build)\n");
} else {
  runStep("2/4 build:staging", "npm", ["run", "build:staging"]);
}

runStep("3/4 validate-staging-build", "npm", ["run", "validate-staging-build"]);

const wranglerArgs = dryRun ? ["deploy", "--dry-run"] : ["deploy"];
runStep(`4/4 wrangler ${dryRun ? "deploy --dry-run" : "deploy"}`, "npx", ["wrangler", ...wranglerArgs]);

console.log(
  dryRun
    ? "\n✓ deploy:staging:preview concluído (dry-run — nada publicado)\n"
    : "\n✓ deploy:staging concluído — revise smoke em https://staging.medicflow.app.br\n",
);
