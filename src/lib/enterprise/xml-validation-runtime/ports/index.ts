export type { XMLValidationRuntimePort } from "./xml-validation-runtime-port";

export type {
  CanonicalXMLValidationCapabilities,
  CanonicalXMLValidationHealth,
  CanonicalXMLValidationIssue,
  CanonicalXMLValidationMetadata,
  CanonicalXMLValidationOperation,
  CanonicalXMLValidationProfile,
  CanonicalXMLValidationReference,
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
  CanonicalXMLValidationStatus,
  CanonicalXMLValidationSummary,
  CanonicalXMLValidationVersion,
  GetCanonicalXMLValidationResultInput,
  GetCanonicalXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeOperationEnvelope,
  XMLValidationRuntimeOperationalControls,
  XMLValidationRuntimeOptions,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationRuntimeRegistration,
  XMLValidationRuntimeStatus,
  XMLValidationRuntimeStructuredLog,
  XMLValidationRuntimeTelemetry,
} from "./types";

export {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  defineXMLValidationRuntimeCapabilities,
  emptyXMLValidationRuntimeCapabilities,
  toCanonicalXMLValidationCapabilities,
} from "./capabilities";

export {
  createXMLValidationId,
  createXMLValidationResultId,
  createXMLValidationRuntimeRequestId,
  resetXMLValidationRuntimeIdSequences,
} from "./identity";
