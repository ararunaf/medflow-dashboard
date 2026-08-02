export type { OCRRuntimePort } from "./ocr-runtime-port";

export type {
  CanonicalOCRCapabilities,
  CanonicalOCRConfiguration,
  CanonicalOCRIdentity,
  CanonicalOCRMetadata,
  CanonicalOCRProviderReference,
  CanonicalOCRProviderReferenceId,
  CanonicalOCRReference,
  CanonicalOCRRequest,
  CanonicalOCRResult,
  CanonicalOCRSession,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimeProviderId,
  OCRRuntimeProviderOptions,
  OCRRuntimeSessionStatus,
  ProcessOCRInput,
  ProcessOCRResult,
} from "./types";

export { STRUCTURAL_OCR_PROVIDER_REFERENCES, resolveStructuralProviderReference } from "./types";

export {
  createOCRRuntimeSessionId,
  resetAllOCRRuntimeIdSequences,
  resetOCRRuntimeSessionIdSequence,
} from "./identity";
