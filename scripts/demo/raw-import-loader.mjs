/**
 * Loader Node para imports `?raw` (sintaxe do Vite) — permite que scripts
 * rodando sob `tsx` usem módulos do app que embutem arquivos assim (ex.: os
 * XSD oficiais TISS em load-xsd-files.raw.ts).
 *
 * Uso: npx tsx --import ./scripts/demo/raw-import-loader.mjs <script.ts>
 */
import { register } from "node:module";

register(
  `data:text/javascript,${encodeURIComponent(`
    import { readFileSync } from "node:fs";
    import { fileURLToPath } from "node:url";
    export async function load(url, context, nextLoad) {
      if (url.startsWith("file:") && url.endsWith("?raw")) {
        const text = readFileSync(fileURLToPath(url.slice(0, -4)), "utf8");
        return { format: "module", shortCircuit: true, source: "export default " + JSON.stringify(text) + ";" };
      }
      return nextLoad(url, context);
    }
  `)}`,
);
