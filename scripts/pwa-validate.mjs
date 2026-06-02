#!/usr/bin/env node
/**
 * Validação PWA — manifest, nome, ícones, splash e artefatos em dist (opcional).
 * Uso: npm run pwa-validate
 *      npm run pwa-validate -- --dist
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePwa } from "./lib/validate-pwa.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const withDist = process.argv.includes("--dist");

console.log("\n[medflow] pwa-validate — MedicFlow-AI\n");

const result = validatePwa(root, { dist: withDist });
for (const p of result.passes) console.log(`  ✓ ${p}`);
for (const w of result.warnings) console.log(`  ! ${w}`);
for (const e of result.errors) console.log(`  ✗ ${e}`);

console.log("\n── Critérios de instalação (Chrome / Edge)\n");
console.log("  • HTTPS no domínio staging");
console.log("  • manifest: name, short_name, start_url, display standalone");
console.log("  • ícones 192×192 e 512×512 (validados acima)");
console.log("  • Service Worker: não configurado — instalação desktop pode ser limitada;");
console.log("    “Adicionar à tela inicial” em mobile costuma funcionar só com manifest.\n");

console.log(
  result.ok
    ? "✓ pwa-validate OK — pronto para smoke manual em staging\n"
    : "✗ pwa-validate com pendências — corrija antes do deploy\n",
);
process.exit(result.ok ? 0 : 1);
