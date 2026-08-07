/**
 * TISSEnterpriseCapabilities — G-01.
 *
 * Matriz progressiva de capabilities do Bloco G.
 * Apenas `tissKnowledgeImplemented` será ativada na G-01.
 */

export interface TISSEnterpriseCapabilities {
  tissKnowledgeImplemented: boolean;
  tissLayoutImplemented: boolean;
  tissParserImplemented: boolean;
  tissSerializerImplemented: boolean;
  tissSchemaValidationImplemented: boolean;
  tissBusinessValidationImplemented: boolean;
  tissOperatorValidationImplemented: boolean;
  tissRepairImplemented: boolean;
  tissCorrectionImplemented: boolean;
  tissEngineImplemented: boolean;
}

export const DEFAULT_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  tissKnowledgeImplemented: false,
  tissLayoutImplemented: false,
  tissParserImplemented: false,
  tissSerializerImplemented: false,
  tissSchemaValidationImplemented: false,
  tissBusinessValidationImplemented: false,
  tissOperatorValidationImplemented: false,
  tissRepairImplemented: false,
  tissCorrectionImplemented: false,
  tissEngineImplemented: false,
};

export const G01_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...DEFAULT_TISS_ENTERPRISE_CAPABILITIES,
  tissKnowledgeImplemented: true,
};

export const G02_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...G01_TISS_ENTERPRISE_CAPABILITIES,
  tissLayoutImplemented: true,
};

export const G03_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...G02_TISS_ENTERPRISE_CAPABILITIES,
  tissParserImplemented: true,
};

export const G04_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...G03_TISS_ENTERPRISE_CAPABILITIES,
  tissSerializerImplemented: true,
};

export const G05_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...G04_TISS_ENTERPRISE_CAPABILITIES,
  tissSchemaValidationImplemented: true,
};

export const G06_TISS_ENTERPRISE_CAPABILITIES: TISSEnterpriseCapabilities = {
  ...G05_TISS_ENTERPRISE_CAPABILITIES,
  tissBusinessValidationImplemented: true,
};
