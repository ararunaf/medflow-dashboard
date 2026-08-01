export type { DocumentProcessorPort } from "./document-processor-port";
export type {
  DocumentProcessingResult,
  DocumentProcessorCapabilities,
  DocumentProcessorHealth,
  DocumentProcessorProviderId,
  DocumentProcessorProviderOptions,
  GetProcessingInput,
  GetProcessingResult,
  ListProcessingsInput,
  ListProcessingsResult,
  OutputId,
  ProcessInput,
  ProcessResult,
  ProcessingConfidence,
  ProcessingDeclaredCapability,
  ProcessingDocumentIdentityReference,
  ProcessingError,
  ProcessingId,
  ProcessingMetadataReference,
  ProcessingOpaqueReference,
  ProcessingOutput,
  ProcessingOutputAttachment,
  ProcessingOutputPage,
  ProcessingOutputReference,
  ProcessingStatus,
  ProcessingStorageReference,
  ProcessingTag,
  ProcessingWarning,
  ProcessorType,
} from "./types";

export { PROCESSING_STATUSES, PROCESSOR_TYPES } from "./types";

export { createOutputId, createProcessingId } from "./identity";

export {
  hasKnownProcessorType,
  listProcessorTypes,
  processingHasKnownProcessorType,
} from "./processor-type";

export {
  defineOutputAttachment,
  defineOutputPage,
  defineProcessingOutput,
  getOutputAttachmentCount,
  getOutputPageCount,
} from "./output";

export {
  defineDocumentIdentityReference,
  defineError,
  defineMetadataReference,
  defineOpaqueReference,
  defineOutputReference,
  defineStorageReference,
  defineWarning,
  referencesDocument,
  referencesOutput,
} from "./references";
