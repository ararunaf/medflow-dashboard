import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Marcas legadas que não devem aparecer em UI, SEO, manifest ou metadados visuais. */
const FORBIDDEN = [
  { id: "medflow", pattern: /\bMedFlow\b/g },
  { id: "medflow-ia", pattern: /\bMedFlow-IA\b/gi },
  { id: "medflow-ia-email", pattern: /medflow-ia\.com(?:\.br)?/gi },
];

const SCAN_ROOTS = ["src", "public"];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".json", ".webmanifest"]);

/** Caminhos internos (env, storage, slugs, domínio infra) — fora do escopo visual. */
const ALLOW_PATH = /(?:medflow-domains|VITE_MEDFLOW_|MEDFLOW_|medflow:|medflow_|medflow-admin|medflow-v1-demo|medflow\.app\.br|medflowTissExport|urn:medflow:)/i;

const ALLOW_LINE =
  /(?:VITE_MEDFLOW_|MEDFLOW_|medflow:|medflow_|medflow-admin|medflow-v1-demo|medflow\.app\.br|medflowTissExport|urn:medflow:|medflow-domains|logo-medicflow|MedicFlow|\[MedFlow\] readiness)/;

function isCommentOnlyLine(line) {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("*") ||
    t.startsWith("/**") ||
    t.startsWith("/*") ||
    t.endsWith("*/")
  );
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, files);
    } else if ([...SCAN_EXTENSIONS].some((ext) => name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Audita referências visuais legadas em `src/` e `public/`.
 * @param {string} cwd
 */
export function auditVisualBranding(cwd) {
  const violations = [];
  const scanned = [];

  for (const root of SCAN_ROOTS) {
    const base = join(cwd, root);
    for (const file of walk(base)) {
      const rel = relative(cwd, file).replace(/\\/g, "/");
      if (ALLOW_PATH.test(rel)) continue;
      scanned.push(rel);
      const lines = readFileSync(file, "utf8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isCommentOnlyLine(line)) continue;
        if (ALLOW_LINE.test(line)) continue;
        for (const rule of FORBIDDEN) {
          if (rule.pattern.test(line)) {
            violations.push({
              file: rel,
              line: i + 1,
              rule: rule.id,
              excerpt: line.trim().slice(0, 120),
            });
          }
          rule.pattern.lastIndex = 0;
        }
      }
    }
  }

  return { ok: violations.length === 0, violations, scannedCount: scanned.length };
}

/**
 * Verifica bundles client (pós-build) por strings legadas exibíveis ao usuário.
 * @param {string} cwd
 */
export function auditClientBundleBranding(cwd) {
  const assetsDir = join(cwd, "dist", "client", "assets");
  const violations = [];
  if (!existsSync(assetsDir)) {
    return { ok: true, violations, skipped: true };
  }

  /** Case-sensitive: evita falso positivo em chaves internas `medflow:*`. */
  const hitPattern = /\bMedFlow(?:-IA)?\b|medflow-ia\.com(?:\.br)?/g;

  for (const file of readdirSync(assetsDir)) {
    if (!file.endsWith(".js") && !file.endsWith(".css")) continue;
    const content = readFileSync(join(assetsDir, file), "utf8");
    const hits = content.match(hitPattern) ?? [];
    const userFacing = [...new Set(hits.map((h) => h.trim()))];
    if (userFacing.length > 0) {
      violations.push({
        file: `dist/client/assets/${file}`,
        samples: userFacing.slice(0, 5),
      });
    }
    hitPattern.lastIndex = 0;
  }

  return { ok: violations.length === 0, violations, skipped: false };
}
