import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Análise estática leve das migrations — não substitui auditoria Supabase.
 */
export function validateMigrationSecurity(migrationsDir) {
  const findings = [];
  if (!existsSync(migrationsDir)) {
    return { ok: false, findings: ["Diretório supabase/migrations não encontrado."] };
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), "utf8");
    const tables = [
      ...content.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi),
    ].map((m) => m[1]);
    for (const table of tables) {
      const hasRls =
        new RegExp(`ALTER TABLE\\s+(?:public\\.)?${table}\\s+ENABLE ROW LEVEL SECURITY`, "i").test(
          content,
        ) || new RegExp(`ENABLE ROW LEVEL SECURITY.*${table}`, "i").test(content);
      if (!hasRls) {
        findings.push(`${file}: tabela "${table}" sem ENABLE ROW LEVEL SECURITY no mesmo arquivo.`);
      }
    }

    if (/GRANT\s+ALL\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+TO\s+anon/i.test(content)) {
      findings.push(`${file}: possível GRANT ALL para anon — revisar manualmente.`);
    }
    if (
      /CREATE POLICY[\s\S]*?\bUSING\s*\(\s*true\s*\)/i.test(content) &&
      /TO\s+anon/i.test(content)
    ) {
      findings.push(`${file}: policy permissiva (USING true) para anon — revisar.`);
    }
  }

  return { ok: findings.length === 0, findings, migrationCount: files.length };
}

export function validateRedirectSafety() {
  const findings = [];
  const appUrl = process.env.VITE_MEDFLOW_APP_URL?.trim();
  if (appUrl && !/^https:\/\//i.test(appUrl)) {
    findings.push("VITE_MEDFLOW_APP_URL deve ser HTTPS para redirects seguros.");
  }
  return { ok: findings.length === 0, findings };
}
