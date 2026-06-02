#!/usr/bin/env node
/**
 * Validação local de desenvolvimento — env, build e estrutura smoke (sem deploy).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDevEnvFiles } from "./lib/env-files.mjs";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { auditClientBundleBranding, auditVisualBranding } from "./lib/branding-audit.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const skipBuild = process.argv.includes("--skip-build");

loadEnvFiles(root, getDevEnvFiles());

let exitCode = 0;

console.log("\n[medflow] local-validate — ambiente de desenvolvimento\n");

const env = validateEnv({ production: false });
if (!env.ok) {
  for (const e of env.errors) console.log(`  ✗ ${e}`);
  console.log("\n  Crie .env ou .env.local a partir de .env.example (veja LOCAL_SETUP.md).\n");
  exitCode = 1;
} else {
  console.log("  ✓ Variáveis Supabase presentes");
}
for (const w of env.warnings) console.log(`  ! ${w}`);

console.log("\n── Branding visual\n");
const visual = auditVisualBranding(root);
if (!visual.ok) {
  for (const v of visual.violations) {
    console.log(`  ✗ ${v.file}:${v.line} [${v.rule}]`);
  }
  exitCode = 1;
} else {
  console.log("  ✓ src/public sem MedFlow / MedFlow-IA em UI, SEO ou manifest");
}

function run(label, script, extraArgs = []) {
  const r = spawnSync(process.execPath, [join(root, "scripts", script), ...extraArgs], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.log(`\n  ✗ Falhou: ${label}\n`);
    exitCode = 1;
    return false;
  }
  return true;
}

if (!skipBuild) {
  console.log("\n── Build\n");
  const build = spawnSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (build.status !== 0) {
    console.log("\n  ✗ Build falhou\n");
    exitCode = 1;
  } else {
    console.log("\n  ✓ Build OK\n");
    const bundle = auditClientBundleBranding(root);
    if (!bundle.skipped && !bundle.ok) {
      for (const v of bundle.violations) {
        console.log(`  ✗ bundle ${v.file}: ${v.samples.join(", ")}`);
      }
      exitCode = 1;
    } else if (!bundle.skipped) {
      console.log("  ✓ Bundle client sem marcas legadas");
    }
  }
} else {
  const bundle = auditClientBundleBranding(root);
  if (!bundle.skipped && !bundle.ok) {
    for (const v of bundle.violations) {
      console.log(`  ✗ bundle ${v.file}: ${v.samples.join(", ")}`);
    }
    exitCode = 1;
  } else if (!bundle.skipped) {
    console.log("  ✓ Bundle client sem marcas legadas (build existente)");
  }
}

run("smoke-check", "smoke-check.mjs");

console.log("\n── Próximos passos\n");
console.log("  npm run dev          → http://localhost:8080");
console.log("  npm run env-check    → validar apenas variáveis");
console.log(
  "  npm run smoke-check -- --url=http://localhost:8080  → health HTTP (com app rodando)\n",
);

console.log(exitCode === 0 ? "✓ local-validate OK\n" : "✗ local-validate com pendências\n");
process.exit(exitCode);
