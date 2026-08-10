/**
 * EnterpriseTissIntelligenceCapabilities — Fase 4 (TISS Intelligence).
 *
 * Capabilities estruturais da camada de inteligência TISS.
 * Nenhuma implementação funcional deve ser acionada por estas flags.
 */

export interface EnterpriseTissIntelligenceCapabilities {
  tissVocabularyDiscoveryImplemented: boolean;
  tissVocabularyCanonicalModelImplemented: boolean;
  tissVocabularyRegistryImplemented: boolean;
  tissVocabularyQueryEngineImplemented: boolean;
  tissGenericVocabularyEngineImplemented: boolean;
}

export const BASELINE_TISS_INTELLIGENCE_CAPABILITIES: EnterpriseTissIntelligenceCapabilities = {
  tissVocabularyDiscoveryImplemented: false,
  tissVocabularyCanonicalModelImplemented: false,
  tissVocabularyRegistryImplemented: false,
  tissVocabularyQueryEngineImplemented: false,
  tissGenericVocabularyEngineImplemented: false,
};

export const EPC20A_TISS_VOCABULARY_DISCOVERY_CAPABILITIES: EnterpriseTissIntelligenceCapabilities =
  {
    ...BASELINE_TISS_INTELLIGENCE_CAPABILITIES,
    tissVocabularyDiscoveryImplemented: true,
  };

export const EPC20B_TISS_VOCABULARY_CANONICAL_MODEL_CAPABILITIES: EnterpriseTissIntelligenceCapabilities =
  {
    ...EPC20A_TISS_VOCABULARY_DISCOVERY_CAPABILITIES,
    tissVocabularyCanonicalModelImplemented: true,
  };
