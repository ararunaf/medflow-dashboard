#!/usr/bin/env node
/**
 * Validação consolidada de produção — somente leitura local, sem deploy.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getProductionEnvFiles } from "./lib/env-files.mjs";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { validateReleaseArtifacts } from "./lib/validate-release.mjs";
import { validateMigrationSecurity, validateRedirectSafety } from "./lib/validate-security.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skipBuild = process.argv.includes("--skip-build");

loadEnvFiles(root, getProductionEnvFiles());

let exitCode = 0;

console.log("\n[medflow] production-validate — readiness completo (sem deploy)\n");

function run(label, script, extraArgs = []) {
  const r = spawnSync(process.execPath, [join(root, "scripts", script), ...extraArgs], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.log(`\n  ✗ Falhou: ${label}\n`);
    exitCode = 1;
  }
  return r.status === 0;
}

run("env-check", "env-check.mjs", ["--production"]);
run("release-check", "release-check.mjs");

const env = validateEnv({ production: true });
const artifacts = validateReleaseArtifacts(root);
const security = validateMigrationSecurity(join(root, "supabase/migrations"));
const redirects = validateRedirectSafety();

if (!env.ok || !artifacts.ok) exitCode = 1;
if (security.findings.length) {
  console.log("\n── Alertas de segurança (revisar antes do go-live):");
  for (const f of security.findings) console.log(`  ! ${f}`);
}
if (!redirects.ok) exitCode = 1;

if (!skipBuild) {
  console.log("\n── Build de produção\n");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
    shell: true,
  });
  if (build.status !== 0) {
    console.log("\n  ✗ Build falhou\n");
    exitCode = 1;
  } else {
    console.log("\n  ✓ Build concluído\n");
  }
} else {
  console.log("\n  (build ignorado — use sem --skip-build para validar compilação)\n");
}

console.log(
  exitCode === 0 ? "✓ production-validate OK\n" : "✗ production-validate com pendências\n",
);
process.exit(exitCode);
