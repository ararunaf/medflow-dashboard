/**
 * RulePackEngineCapabilities — capacidades declarativas (TISS-03).
 *
 * Apenas declaração estrutural. Sem XML. Sem operadoras. Sem regras ANS.
 */

export type RulePackEngineCapabilities = {
  supportsLoadPack?: boolean;
  supportsListPacks?: boolean;
  supportsInterpretPack?: boolean;
  supportsExecutePack?: boolean;
  supportsGetExecution?: boolean;
  supportsListExecutions?: boolean;
  supportsCanonicalResult?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  consumesTISSCatalogPort?: boolean;
  implementsRealXml?: false;
  implementsOperatorDispatch?: false;
  implementsAnsValidation?: false;
  implementsBusinessRules?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
};

export function emptyRulePackEngineCapabilities(): RulePackEngineCapabilities {
  return {};
}

export function defineRulePackEngineCapabilities(
  capabilities: RulePackEngineCapabilities = {},
): RulePackEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_RULE_PACK_ENGINE_CAPABILITIES: RulePackEngineCapabilities = {
  supportsLoadPack: true,
  supportsListPacks: true,
  supportsInterpretPack: true,
  supportsExecutePack: true,
  supportsGetExecution: true,
  supportsListExecutions: true,
  supportsCanonicalResult: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  consumesTISSCatalogPort: true,
  implementsRealXml: false,
  implementsOperatorDispatch: false,
  implementsAnsValidation: false,
  implementsBusinessRules: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
};

export const DEFAULT_MOCK_RULE_PACK_ENGINE_CAPABILITIES: RulePackEngineCapabilities = {
  ...DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
};
