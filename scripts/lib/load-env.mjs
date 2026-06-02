import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Carrega cadeia de arquivos .env (último arquivo vence — alinhado ao Vite).
 * Variáveis já presentes no processo antes da chamada (CI/shell) não são sobrescritas.
 */
export function loadEnvFiles(cwd, filenames = [".env", ".env.production"]) {
  const shellPreset = new Set(Object.keys(process.env));

  for (const name of filenames) {
    const filePath = join(cwd, name);
    if (!existsSync(filePath)) continue;
    const raw = readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (shellPreset.has(key)) continue;
      process.env[key] = value;
    }
  }
}
