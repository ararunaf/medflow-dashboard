/**
 * Enterprise Document Processing Foundation — Ports & Adapters (EPC-13).
 *
 * Fluxo oficial:
 *   Application → DocumentProcessorPort → DocumentProcessorAdapter
 *     → DocumentProcessorStore → DocumentProcessorFactory → DocumentProcessorProvider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, OCR implementado,
 * IA, parsers XML/PDF, Barcode, QRCode, upload, scanner ou Workflow de produto.
 *
 * Todo Processor futuro produz exatamente o mesmo modelo canônico de saída
 * (DocumentProcessingResult + ProcessingOutput). O restante do Enterprise
 * nunca conhece a tecnologia de processamento.
 *
 * Especializações de domínio ficam FORA deste componente.
 */
export type {
  DocumentProcessingResult,
  DocumentProcessorCapabilities,
  DocumentProcessorHealth,
  DocumentProcessorPort,
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
} from "./ports";

export {
  PROCESSING_STATUSES,
  PROCESSOR_TYPES,
  createOutputId,
  createProcessingId,
  defineDocumentIdentityReference,
  defineError,
  defineMetadataReference,
  defineOpaqueReference,
  defineOutputAttachment,
  defineOutputPage,
  defineOutputReference,
  defineProcessingOutput,
  defineStorageReference,
  defineWarning,
  getOutputAttachmentCount,
  getOutputPageCount,
  hasKnownProcessorType,
  listProcessorTypes,
  processingHasKnownProcessorType,
  referencesDocument,
  referencesOutput,
} from "./ports";

export {
  DEFAULT_DOCUMENT_PROCESSOR_ADAPTER_ID,
  DefaultDocumentProcessorAdapter,
  MockDocumentProcessorAdapter,
  type DefaultDocumentProcessorRuntime,
  type MockDocumentProcessorAdapterOptions,
} from "./adapters";

export {
  DEFAULT_DOCUMENT_PROCESSOR_STORE_ID,
  DefaultDocumentProcessorStore,
  type DefaultDocumentProcessorStoreOptions,
  type DocumentProcessorStore,
  type StoredDocumentProcessing,
} from "./store";

export {
  DocumentProcessorFactory,
  createDocumentProcessorFactory,
  type DocumentProcessorFactoryOptions,
} from "./factory";

export { createDocumentProcessorPort } from "./providers";

export { getDocumentProcessorHealthSummary, type DocumentProcessorHealthSummary } from "./demo";
