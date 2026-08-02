/**
 * DocumentClassificationCapabilities — capacidades declarativas (CLASS-01).
 *
 * Apenas declaração estrutural. Sem IA / ML / embeddings.
 */

export type DocumentClassificationCapabilities = {
  supportedDocumentTypes?: readonly string[];
  supportedLanguages?: readonly string[];
  supportsConfidence?: boolean;
  supportsMultiLabel?: boolean;
  supportsRuleBased?: boolean;
  supportsConfigurableRules?: boolean;
  supportsBatch?: boolean;
  supportsAsync?: boolean;
  implementsAi?: false;
  implementsMachineLearning?: false;
  implementsEmbeddings?: false;
  implementsLlm?: false;
};

export function emptyDocumentClassificationCapabilities(): DocumentClassificationCapabilities {
  return {};
}

export function defineDocumentClassificationCapabilities(
  capabilities: DocumentClassificationCapabilities = {},
): DocumentClassificationCapabilities {
  return { ...capabilities };
}

export const DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES: DocumentClassificationCapabilities = {
  supportedDocumentTypes: [
    "guia-tiss",
    "solicitacao",
    "prontuario",
    "laudo",
    "documento-administrativo",
    "documento-financeiro",
    "documento-desconhecido",
  ],
  supportedLanguages: ["pt-BR", "en"],
  supportsConfidence: true,
  supportsMultiLabel: false,
  supportsRuleBased: true,
  supportsConfigurableRules: true,
  supportsBatch: false,
  supportsAsync: false,
  implementsAi: false,
  implementsMachineLearning: false,
  implementsEmbeddings: false,
  implementsLlm: false,
};

export const DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES: DocumentClassificationCapabilities = {
  ...DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
  supportsConfigurableRules: false,
};
