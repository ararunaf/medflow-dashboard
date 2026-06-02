#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditClientBundleBranding, auditVisualBranding } from "./lib/branding-audit.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkBundle = process.argv.includes("--bundle");

console.log("\n[medicflow] branding-audit — referências visuais legadas\n");

const source = auditVisualBranding(root);
console.log(`  Fontes: ${source.scannedCount} arquivo(s) em src/ e public/`);

if (source.ok) {
  console.log("  ✓ Nenhuma referência MedFlow / MedFlow-IA em UI, SEO ou manifest");
} else {
  for (const v of source.violations) {
    console.log(`  ✗ ${v.file}:${v.line} [${v.rule}] ${v.excerpt}`);
  }
}

let exitCode = source.ok ? 0 : 1;

if (checkBundle) {
  const bundle = auditClientBundleBranding(root);
  if (bundle.skipped) {
    console.log("\n  (bundle) dist/client/assets ausente — rode npm run build antes de --bundle");
  } else if (bundle.ok) {
    console.log("  ✓ Bundle client sem marcas legadas exibíveis");
  } else {
    for (const v of bundle.violations) {
      console.log(`  ✗ ${v.file}: ${v.samples.join(", ")}`);
    }
    exitCode = 1;
  }
}

console.log("");
process.exit(exitCode);
