#!/usr/bin/env node

import { dirname, join } from "node:path";

import { fileURLToPath } from "node:url";

import {

  getDevEnvFiles,

  getProductionEnvFiles,

  getStagingEnvFiles,

} from "./lib/env-files.mjs";

import { loadEnvFiles } from "./lib/load-env.mjs";

import { validateEnv } from "./lib/validate-env.mjs";



const __dirname = dirname(fileURLToPath(import.meta.url));

const root = join(__dirname, "..");



const production = process.argv.includes("--production");

const staging = process.argv.includes("--staging");



const envFiles = production

  ? getProductionEnvFiles()

  : staging

    ? getStagingEnvFiles()

    : getDevEnvFiles();



loadEnvFiles(root, envFiles);



const result = validateEnv({ production: production || staging, staging });



const label = production ? "produção" : staging ? "staging" : "desenvolvimento";

console.log(`\n[medflow] env-check (${label})\n`);



if (result.errors.length) {

  console.log("Erros:");

  for (const e of result.errors) console.log(`  ✗ ${e}`);

}

if (result.warnings.length) {

  console.log("Avisos:");

  for (const w of result.warnings) console.log(`  ! ${w}`);

}

if (result.ok && !result.warnings.length) {

  console.log("  ✓ Variáveis obrigatórias presentes.");

}



console.log("");

process.exit(result.ok ? 0 : 1);

