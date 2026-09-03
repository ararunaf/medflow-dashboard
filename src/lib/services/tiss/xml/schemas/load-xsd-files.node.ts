/**
 * Carrega os 6 arquivos XSD via node:fs — usado por testes/CLI (tsx), que
 * rodam fora do bundler Vite e não entendem a sintaxe `?raw`. O app real
 * (empacotado para o Cloudflare Workers do deploy, sem filesystem) usa
 * load-xsd-files.raw.ts em vez deste arquivo — ver README.md ao lado.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE_NAMES = [
  "tissV4_01_00.xsd",
  "tissSimpleTypesV4_01_00.xsd",
  "tissComplexTypesV4_01_00.xsd",
  "tissGuiasV4_01_00.xsd",
  "tissAssinaturaDigital_v1.01.xsd",
  "xmldsig-core-schema.xsd",
] as const;

export function loadTissXsdFilesFromDisk(): Record<string, string> {
  const dir = dirname(fileURLToPath(import.meta.url));
  const files: Record<string, string> = {};
  for (const name of FILE_NAMES) {
    files[name] = readFileSync(join(dir, name), "utf8");
  }
  return files;
}
