/**
 * TISSCatalogCapabilities — capacidades declarativas (TISS-02).
 *
 * Apenas declaração estrutural. Sem XML. Sem operadoras. Sem regras ANS.
 */

export type TISSCatalogCapabilities = {
  supportsCanonicalCatalog?: boolean;
  supportsVersions?: boolean;
  supportsGuideTypes?: boolean;
  supportsProcedureTypes?: boolean;
  supportsProcedureGroups?: boolean;
  supportsDomains?: boolean;
  supportsProfiles?: boolean;
  supportsVocabulary?: boolean;
  supportsReferences?: boolean;
  supportsStatistics?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  implementsRealXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
};

export function emptyTISSCatalogCapabilities(): TISSCatalogCapabilities {
  return {};
}

export function defineTISSCatalogCapabilities(
  capabilities: TISSCatalogCapabilities = {},
): TISSCatalogCapabilities {
  return { ...capabilities };
}

export const DEFAULT_TISS_CATALOG_CAPABILITIES: TISSCatalogCapabilities = {
  supportsCanonicalCatalog: true,
  supportsVersions: true,
  supportsGuideTypes: true,
  supportsProcedureTypes: true,
  supportsProcedureGroups: true,
  supportsDomains: true,
  supportsProfiles: true,
  supportsVocabulary: true,
  supportsReferences: true,
  supportsStatistics: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  implementsRealXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
};

export const DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES: TISSCatalogCapabilities = {
  ...DEFAULT_TISS_CATALOG_CAPABILITIES,
};
