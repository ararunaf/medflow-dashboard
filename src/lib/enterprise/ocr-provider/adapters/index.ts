export {
  DEFAULT_MOCK_OCR_PROVIDER_VERSION,
  DefaultMockOCRProvider,
  MOCK_OCR_PROVIDER_ADAPTER_ID,
  MockOCRProviderAdapter,
  type MockOCRProviderAdapterOptions,
} from "./mock-ocr-provider-adapter";

export {
  AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
  AZURE_DOCUMENT_INTELLIGENCE_API_VERSION,
  AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION,
  AzureDocumentIntelligenceAdapter,
  DEFAULT_AZURE_OCR_CAPABILITIES,
  resolveAzureDocumentIntelligenceConfig,
  type AzureDocumentIntelligenceAdapterOptions,
  type AzureFetchFn,
} from "./azure-document-intelligence-adapter";
