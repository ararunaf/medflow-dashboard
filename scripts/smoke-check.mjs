#!/usr/bin/env node
/**
 * Smoke check de CI — valida estrutura e opcionalmente health HTTP público.
 * Testes autenticados (login, TISS, conciliação) rodam no app via /lancamento.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getDevEnvFiles, getProductionEnvFiles } from "./lib/env-files.mjs";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { validateEnv } from "./lib/validate-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const production = process.argv.includes("--production");

loadEnvFiles(root, production ? getProductionEnvFiles() : getDevEnvFiles());

const SMOKE_IDS = ["login", "dashboard", "tiss", "reconciliation", "onboarding"];

let exitCode = 0;

console.log("\n[medflow] smoke-check — estrutura e health público\n");

const env = validateEnv({ production: process.argv.includes("--production") });
if (!env.ok) {
  for (const e of env.errors) console.log(`  ✗ ${e}`);
  exitCode = 1;
} else {
  console.log("  ✓ Env base para smoke");
}

const smokeService = join(root, "src/lib/services/smoke-test/smoke-test-service.ts");
if (!existsSync(smokeService)) {
  console.log("  ✗ smoke-test-service.ts ausente");
  exitCode = 1;
} else {
  const src = readFileSync(smokeService, "utf8");
  for (const id of SMOKE_IDS) {
    if (!src.includes(`"${id}"`) && !src.includes(`'${id}'`) && id !== "tiss") {
      if (id === "financial" || id === "reconciliation") continue;
    }
    if (id === "tiss" && !src.includes('"tiss"') && !src.includes("tiss")) {
      console.log("  ✗ Teste TISS não encontrado no serviço");
      exitCode = 1;
    }
  }
  if (src.includes("tiss") || src.includes('"tiss"')) {
    console.log("  ✓ Serviço smoke inclui TISS");
  }
  console.log("  ✓ smoke-test-service presente");
  console.log(`  → Cenários esperados no app: ${SMOKE_IDS.join(", ")}`);
}

const urlArg = process.argv.find((a) => a.startsWith("--url="));
/** Health HTTP só com --url explícito (evita falha em CI com placeholder). */
const healthUrl = urlArg?.slice(6) ?? process.env.SMOKE_BASE_URL;

if (healthUrl) {
  const target = healthUrl.replace(/\/$/, "");
  const paths = ["/health", "/health/db", "/health/auth", "/site", "/login"];
  console.log(`\n── Health HTTP (${target})`);
  for (const path of paths) {
    try {
      const res = await fetch(`${target}${path}`, { redirect: "manual" });
      let ok = res.status < 500;
      if (path.startsWith("/health")) {
        ok = res.status === 200;
        if (ok) {
          try {
            const body = await res.json();
            ok = body?.status === "ok";
            console.log(
              `  ${ok ? "✓" : "✗"} ${path} → ${res.status} (${body?.status ?? "unknown"})`,
            );
          } catch {
            ok = false;
            console.log(`  ✗ ${path} → ${res.status} (JSON inválido)`);
          }
        } else {
          console.log(`  ✗ ${path} → ${res.status}`);
        }
      } else {
        console.log(`  ${ok ? "✓" : "✗"} ${path} → ${res.status}`);
      }
      if (!ok) exitCode = 1;
    } catch (err) {
      console.log(`  ✗ ${path} → ${err instanceof Error ? err.message : String(err)}`);
      exitCode = 1;
    }
  }
} else {
  console.log(
    "\n  (Opcional) Passe --url=https://seu-dominio-deployado para health HTTP pós-deploy.",
  );
  console.log("  Smoke autenticado: execute no app em /lancamento após deploy manual.\n");
}

console.log("");
process.exit(exitCode);
