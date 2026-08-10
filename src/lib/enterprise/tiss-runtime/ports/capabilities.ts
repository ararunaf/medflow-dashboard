export interface EnterpriseTissRuntimeCapabilities {
  tissRuntimeDiscoveryImplemented: boolean;
  tissRuntimeCanonicalModelImplemented: boolean;
  tissRuntimeRegistryImplemented: boolean;
  tissRuntimeOrchestrationImplemented: boolean;
  tissGenericRuntimeEngineImplemented: boolean;
}

export const EPC23A_TISS_RUNTIME_DISCOVERY_CAPABILITIES: EnterpriseTissRuntimeCapabilities = {
  tissRuntimeDiscoveryImplemented: true,
  tissRuntimeCanonicalModelImplemented: false,
  tissRuntimeRegistryImplemented: false,
  tissRuntimeOrchestrationImplemented: false,
  tissGenericRuntimeEngineImplemented: false,
};

export const EPC23B_TISS_RUNTIME_CANONICAL_CAPABILITIES: EnterpriseTissRuntimeCapabilities = {
  tissRuntimeDiscoveryImplemented: true,
  tissRuntimeCanonicalModelImplemented: true,
  tissRuntimeRegistryImplemented: false,
  tissRuntimeOrchestrationImplemented: false,
  tissGenericRuntimeEngineImplemented: false,
};

export const EPC23C_TISS_RUNTIME_REGISTRY_CAPABILITIES: EnterpriseTissRuntimeCapabilities = {
  tissRuntimeDiscoveryImplemented: true,
  tissRuntimeCanonicalModelImplemented: true,
  tissRuntimeRegistryImplemented: true,
  tissRuntimeOrchestrationImplemented: false,
  tissGenericRuntimeEngineImplemented: false,
};

export const EPC23D_TISS_RUNTIME_ORCHESTRATION_CAPABILITIES: EnterpriseTissRuntimeCapabilities = {
  tissRuntimeDiscoveryImplemented: true,
  tissRuntimeCanonicalModelImplemented: true,
  tissRuntimeRegistryImplemented: true,
  tissRuntimeOrchestrationImplemented: true,
  tissGenericRuntimeEngineImplemented: false,
};
