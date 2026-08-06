/**
 * XSD Validation funcional — D-02 / BLOCO D.
 *
 * Exporta contratos canônicos + XSDValidator genérico.
 * Sem XPath. Sem Transformation. Sem SOAP. Sem TISS. Sem Operadoras.
 * Sem Auto Repair. Sem Workflow. Sem Persistência.
 */
export type {
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
  CanonicalXSDValidationResult,
  XMLValidationRuntimeContext,
} from "./canonical";

export { createEmptyXMLValidationRuntimeContext } from "./canonical";

export {
  XSDValidator,
  defaultXSDValidator,
  validateXSD,
  type XSDValidatorOptions,
} from "./xsd-validator";
