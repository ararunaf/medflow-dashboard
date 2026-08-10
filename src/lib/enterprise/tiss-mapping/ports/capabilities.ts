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
