import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const REQUIRED_DOCS = [
  "LOCAL_SETUP.md",
  "docs/cloudflare-pages.md",
  "docs/supabase-production.md",
  "docs/deploy-checklist.md",
  "docs/go-live-checklist.md",
  "docs/rollback-checklist.md",
  "docs/smoke-test-checklist.md",
  "docs/backup-readiness.md",
];

const REQUIRED_SERVICES = [
  "src/lib/services/deployment-readiness/deployment-readiness-service.ts",
  "src/lib/services/production-validation/production-validation-service.ts",
  "src/lib/services/smoke-test/smoke-test-service.ts",
  "src/lib/services/release-readiness/release-readiness-service.ts",
];

/**
 * Readiness de artefatos de release — sem deploy nem alteração remota.
 */
export function validateReleaseArtifacts(cwd) {
  const errors = [];
  const warnings = [];

  for (const rel of REQUIRED_DOCS) {
    if (!existsSync(join(cwd, rel))) {
      errors.push(`Documentação ausente: ${rel}`);
    }
  }

  for (const rel of REQUIRED_SERVICES) {
    if (!existsSync(join(cwd, rel))) {
      errors.push(`Serviço ausente: ${rel}`);
    }
  }

  const migrationsDir = join(cwd, "supabase/migrations");
  if (!existsSync(migrationsDir)) {
    errors.push("supabase/migrations ausente.");
  } else {
    const count = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).length;
    if (count < 1) warnings.push("Nenhuma migration SQL encontrada.");
  }

  if (!existsSync(join(cwd, ".github/workflows/ci.yml"))) {
    errors.push("Workflow CI ausente: .github/workflows/ci.yml");
  }

  if (!existsSync(join(cwd, "wrangler.jsonc"))) {
    warnings.push("wrangler.jsonc ausente — deploy Cloudflare Workers pode falhar.");
  }

  return { ok: errors.length === 0, errors, warnings };
}
