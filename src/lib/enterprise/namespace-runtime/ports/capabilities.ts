/**
 * NamespaceRuntimeCapabilities — capacidades declarativas (TISS-10).
 *
 * Apenas declaração estrutural. Sem namespace oficial. Sem resolução/validação real. Sem XML TISS/ANS.
 */

import type { CanonicalNamespaceCapabilities } from "./canonical";

export type NamespaceRuntimeCapabilities = {
  supportsPrepare?: boolean;
  supportsGetResult?: boolean;
  supportsListResults?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalNamespace?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  runtimeReady?: true;
  officialNamespacesLoaded?: false;
  realNamespacesLoaded?: false;
  namespaceResolutionEnabled?: false;
  namespaceValidationEnabled?: false;
  officialAnsNamespacesLoaded?: false;
  officialTissNamespacesLoaded?: false;
  implementsOfficialNamespaces?: false;
  implementsNamespaceValidation?: false;
  implementsRealNamespaceResolution?: false;
  implementsOperatorDispatch?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyNamespaceRuntimeCapabilities(): NamespaceRuntimeCapabilities {
  return {};
}

export function defineNamespaceRuntimeCapabilities(
  capabilities: NamespaceRuntimeCapabilities = {},
): NamespaceRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES: NamespaceRuntimeCapabilities = {
  supportsPrepare: true,
  supportsGetResult: true,
  supportsListResults: true,
  supportsHealth: true,
  supportsCanonicalNamespace: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  runtimeReady: true,
  officialNamespacesLoaded: false,
  realNamespacesLoaded: false,
  namespaceResolutionEnabled: false,
  namespaceValidationEnabled: false,
  officialAnsNamespacesLoaded: false,
  officialTissNamespacesLoaded: false,
  implementsOfficialNamespaces: false,
  implementsNamespaceValidation: false,
  implementsRealNamespaceResolution: false,
  implementsOperatorDispatch: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES: NamespaceRuntimeCapabilities = {
  ...DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
};

export function toCanonicalNamespaceCapabilities(
  capabilities: NamespaceRuntimeCapabilities = DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
): CanonicalNamespaceCapabilities {
  return {
    kind: "canonical-namespace-capabilities",
    supportsPrepare: capabilities.supportsPrepare === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsListResults: capabilities.supportsListResults === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalNamespace: capabilities.supportsCanonicalNamespace === true,
    runtimeReady: true,
    officialNamespacesLoaded: false,
    realNamespacesLoaded: false,
    namespaceResolutionEnabled: false,
    namespaceValidationEnabled: false,
    officialAnsNamespacesLoaded: false,
    officialTissNamespacesLoaded: false,
    implementsOfficialNamespaces: false,
    implementsNamespaceValidation: false,
    implementsRealNamespaceResolution: false,
    implementsOperatorDispatch: false,
    implementsBusinessRules: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
