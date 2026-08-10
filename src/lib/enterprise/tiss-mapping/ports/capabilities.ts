/**
 * EnterpriseTissMappingCapabilities — Fase 5 (TISS Mapping).
 *
 * Capabilities estruturais da camada de mapeamento TISS.
 * Nenhuma implementação funcional deve ser acionada por estas flags.
 */

export interface EnterpriseTissMappingCapabilities {
  tissMappingDiscoveryImplemented: boolean;
  tissMappingCanonicalModelImplemented: boolean;
  tissMappingRegistryImplemented: boolean;
  tissMappingQueryEngineImplemented: boolean;
  tissGenericMappingEngineImplemented: boolean;
}

export const BASELINE_TISS_MAPPING_CAPABILITIES: EnterpriseTissMappingCapabilities = {
  tissMappingDiscoveryImplemented: false,
  tissMappingCanonicalModelImplemented: false,
  tissMappingRegistryImplemented: false,
  tissMappingQueryEngineImplemented: false,
  tissGenericMappingEngineImplemented: false,
};

export const EPC21A_TISS_MAPPING_DISCOVERY_CAPABILITIES: EnterpriseTissMappingCapabilities = {
  ...BASELINE_TISS_MAPPING_CAPABILITIES,
  tissMappingDiscoveryImplemented: true,
};

export const EPC21B_TISS_MAPPING_CANONICAL_MODEL_CAPABILITIES: EnterpriseTissMappingCapabilities = {
  ...EPC21A_TISS_MAPPING_DISCOVERY_CAPABILITIES,
  tissMappingCanonicalModelImplemented: true,
};

export const EPC21C_TISS_MAPPING_REGISTRY_CAPABILITIES: EnterpriseTissMappingCapabilities = {
  ...EPC21B_TISS_MAPPING_CANONICAL_MODEL_CAPABILITIES,
  tissMappingRegistryImplemented: true,
};

export const EPC21D_TISS_MAPPING_QUERY_ENGINE_CAPABILITIES: EnterpriseTissMappingCapabilities = {
  ...EPC21C_TISS_MAPPING_REGISTRY_CAPABILITIES,
  tissMappingQueryEngineImplemented: true,
};
