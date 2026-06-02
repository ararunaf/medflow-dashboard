#!/usr/bin/env node
/**
 * Valida artefatos pós `npm run build:vercel` (Nitro → .vercel/output).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, ".vercel", "output");

let exitCode = 0;
const errors = [];
const passes = [];

console.log("\n[medflow] vercel-validate\n");

if (!existsSync(outputDir)) {
  errors.push(".vercel/output ausente — rode npm run build:vercel com MEDFLOW_DEPLOY_TARGET=vercel");
} else {
  passes.push(".vercel/output presente");
  const configPath = join(outputDir, "config.json");
  if (!existsSync(configPath)) errors.push(".vercel/output/config.json ausente");
  else passes.push("config.json presente");

  const walk = (dir, depth = 0) => {
    if (depth > 4 || !existsSync(dir)) return [];
    const names = [];
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      try {
        if (statSync(p).isDirectory()) names.push(...walk(p, depth + 1));
        else names.push(p);
      } catch {
        /* ignore */
      }
    }
    return names;
  };
  const files = walk(outputDir);
  const hasFunction =
    files.some((f) => f.includes("functions") && f.endsWith(".func")) ||
    files.some((f) => f.includes("functions") && (f.endsWith(".js") || f.endsWith(".mjs")));
  if (!hasFunction) {
    errors.push("Nenhuma Vercel Function detectada em .vercel/output — confira preset vercel no Nitro");
  } else passes.push("Vercel Functions registradas");
}

if (errors.length) {
  console.log("Erros:");
  for (const e of errors) console.log(`  ✗ ${e}`);
  exitCode = 1;
}
for (const p of passes) console.log(`  ✓ ${p}`);

console.log(exitCode === 0 ? "\n✓ vercel-validate OK\n" : "\n✗ vercel-validate com pendências\n");
process.exit(exitCode);
