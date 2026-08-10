/**
 * EnterpriseTissIntelligenceCapabilities — Fase 6 (TISS Intelligence).
 *
 * Capabilities estruturais da camada de inteligencia TISS.
 * Nenhuma implementacao funcional deve ser acionada por estas flags.
 */

export interface EnterpriseTissIntelligenceCapabilities {
  tissIntelligenceDiscoveryImplemented: boolean;
  tissIntelligenceCanonicalModelImplemented: boolean;
  tissIntelligenceRegistryImplemented: boolean;
  tissIntelligenceDecisionEngineImplemented: boolean;
  tissGenericIntelligenceEngineImplemented: boolean;
}

export const BASELINE_TISS_INTELLIGENCE_CAPABILITIES: EnterpriseTissIntelligenceCapabilities = {
  tissIntelligenceDiscoveryImplemented: false,
  tissIntelligenceCanonicalModelImplemented: false,
  tissIntelligenceRegistryImplemented: false,
  tissIntelligenceDecisionEngineImplemented: false,
  tissGenericIntelligenceEngineImplemented: false,
};

export const EPC22A_TISS_INTELLIGENCE_DISCOVERY_CAPABILITIES: EnterpriseTissIntelligenceCapabilities =
  {
    ...BASELINE_TISS_INTELLIGENCE_CAPABILITIES,
    tissIntelligenceDiscoveryImplemented: true,
  };

export const EPC22B_TISS_INTELLIGENCE_CANONICAL_MODEL_CAPABILITIES: EnterpriseTissIntelligenceCapabilities =
  {
    ...EPC22A_TISS_INTELLIGENCE_DISCOVERY_CAPABILITIES,
    tissIntelligenceCanonicalModelImplemented: true,
  };
