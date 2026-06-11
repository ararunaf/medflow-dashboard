#!/usr/bin/env node
/**
 * Validação obrigatória do bundle staging (dist/) — bloqueia deploy se falhar.
 * Uso: npm run validate-staging-build
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateStagingBuild } from "./lib/validate-staging-build.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

console.log("\n[medflow] validate-staging-build — guard rail pré-deploy staging\n");

const result = validateStagingBuild(root);

for (const pass of result.passes) console.log(`  ✓ ${pass}`);
for (const warning of result.warnings) console.log(`  ! ${warning}`);
for (const error of result.errors) console.log(`  ✗ ${error}`);

console.log(
  result.ok
    ? "\n✓ validate-staging-build OK — bundle apto para deploy staging\n"
    : "\n✗ validate-staging-build FALHOU — deploy staging deve ser abortado\n",
);

process.exit(result.ok ? 0 : 1);
