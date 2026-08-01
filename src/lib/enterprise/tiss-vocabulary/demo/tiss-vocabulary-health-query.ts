/**
 * PoC Application — depende apenas de TISSVocabularyPort (EPC-20).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, Workflow ou Rule Engine.
 * Serve exclusivamente para provar Application → Port → Adapter → Store.
 */
import type { TISSVocabularyPort } from "../ports/tiss-vocabulary-port";
import type { TISSVocabularyCapabilities, TISSVocabularyHealth } from "../ports/types";

export type TISSVocabularyHealthSummary = {
  health: TISSVocabularyHealth;
  capabilities: TISSVocabularyCapabilities;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades via Port.
 * Zero conhecimento de layout XML, parser, validação ou operadoras.
 */
export async function getTISSVocabularyHealthSummary(
  port: TISSVocabularyPort,
): Promise<TISSVocabularyHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  return {
    health,
    capabilities,
    architectureLayer: "application",
  };
}
