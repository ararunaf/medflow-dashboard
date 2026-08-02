/**
 * TISSProviderCapabilities — capacidades declarativas (TISS-01).
 *
 * Apenas declaração estrutural. Sem XML real. Sem envio a operadoras.
 * Sem validações clínicas. Sem regras ANS específicas.
 */

export type TISSProviderCapabilities = {
  supportedModes?: readonly string[];
  supportsStructuralProcess?: boolean;
  supportsResolveProfile?: boolean;
  supportsResolveProvider?: boolean;
  supportsCanonicalResult?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  implementsRealXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsClinicalValidation?: false;
};

export function emptyTISSProviderCapabilities(): TISSProviderCapabilities {
  return {};
}

export function defineTISSProviderCapabilities(
  capabilities: TISSProviderCapabilities = {},
): TISSProviderCapabilities {
  return { ...capabilities };
}

export const DEFAULT_TISS_PROVIDER_CAPABILITIES: TISSProviderCapabilities = {
  supportedModes: ["structural-process", "resolve-profile", "resolve-provider", "health-probe"],
  supportsStructuralProcess: true,
  supportsResolveProfile: true,
  supportsResolveProvider: true,
  supportsCanonicalResult: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  implementsRealXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsClinicalValidation: false,
};

export const DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES: TISSProviderCapabilities = {
  ...DEFAULT_TISS_PROVIDER_CAPABILITIES,
};
