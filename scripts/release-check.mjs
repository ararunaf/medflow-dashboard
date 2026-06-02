#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getProductionEnvFiles } from "./lib/env-files.mjs";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { validateEnv } from "./lib/validate-env.mjs";
import { validateReleaseArtifacts } from "./lib/validate-release.mjs";
import { validateMigrationSecurity, validateRedirectSafety } from "./lib/validate-security.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

loadEnvFiles(root, getProductionEnvFiles());

const env = validateEnv({ production: true });
const artifacts = validateReleaseArtifacts(root);
const security = validateMigrationSecurity(join(root, "supabase/migrations"));
const redirects = validateRedirectSafety();

let exitCode = 0;

console.log("\n[medflow] release-check — validação pré-release (sem deploy)\n");

function section(title) {
  console.log(`── ${title}`);
}

section("Ambiente");
for (const e of env.errors) {
  console.log(`  ✗ ${e}`);
  exitCode = 1;
}
for (const w of env.warnings) console.log(`  ! ${w}`);
if (env.ok) console.log("  ✓ Variáveis obrigatórias OK");

section("Artefatos");
for (const e of artifacts.errors) {
  console.log(`  ✗ ${e}`);
  exitCode = 1;
}
for (const w of artifacts.warnings) console.log(`  ! ${w}`);
if (artifacts.ok) console.log("  ✓ Docs, serviços e CI presentes");

section("Segurança (migrations)");
console.log(`  Migrations analisadas: ${security.migrationCount ?? 0}`);
for (const f of security.findings) {
  console.log(`  ! ${f}`);
}
if (security.ok) console.log("  ✓ Nenhum alerta estático crítico");

section("Redirects");
for (const f of redirects.findings) console.log(`  ! ${f}`);
if (redirects.ok) console.log("  ✓ Redirects públicos OK");

console.log(
  "\nPróximo passo manual: npm run build && deploy via painel Cloudflare (não automatizado aqui).\n",
);
process.exit(exitCode);
