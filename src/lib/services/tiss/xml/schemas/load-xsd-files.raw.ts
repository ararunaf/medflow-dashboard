/**
 * Carrega os 6 arquivos XSD embutidos no bundle via `?raw` (Vite) — usado
 * pelo app real, que roda no Cloudflare Workers do deploy (sem filesystem
 * em tempo de execução). Testes/CLI usam load-xsd-files.node.ts em vez
 * deste arquivo, porque `tsx` não processa a sintaxe `?raw` do Vite.
 */
import tissV4_01_00 from "./tissV4_01_00.xsd?raw";
import tissSimpleTypesV4_01_00 from "./tissSimpleTypesV4_01_00.xsd?raw";
import tissComplexTypesV4_01_00 from "./tissComplexTypesV4_01_00.xsd?raw";
import tissGuiasV4_01_00 from "./tissGuiasV4_01_00.xsd?raw";
import tissAssinaturaDigital_v1_01 from "./tissAssinaturaDigital_v1.01.xsd?raw";
import xmldsigCoreSchema from "./xmldsig-core-schema.xsd?raw";

export function loadTissXsdFilesBundled(): Record<string, string> {
  return {
    "tissV4_01_00.xsd": tissV4_01_00,
    "tissSimpleTypesV4_01_00.xsd": tissSimpleTypesV4_01_00,
    "tissComplexTypesV4_01_00.xsd": tissComplexTypesV4_01_00,
    "tissGuiasV4_01_00.xsd": tissGuiasV4_01_00,
    "tissAssinaturaDigital_v1.01.xsd": tissAssinaturaDigital_v1_01,
    "xmldsig-core-schema.xsd": xmldsigCoreSchema,
  };
}
