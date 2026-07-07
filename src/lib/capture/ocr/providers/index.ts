export { AzureDocumentIntelligenceProvider } from "./azure-document-intelligence-provider";
export { Gpt4VisionProvider } from "./gpt4-vision-provider";
export { TesseractProvider } from "./tesseract-provider";
export {
  buildRawOcrResult,
  resolveAzureConfig,
  CAPTURE_OCR_MAX_BYTES,
  CAPTURE_OCR_SUPPORTED_MIMES,
} from "./shared";

import { AzureDocumentIntelligenceProvider } from "./azure-document-intelligence-provider";
import { Gpt4VisionProvider } from "./gpt4-vision-provider";
import { TesseractProvider } from "./tesseract-provider";
import type { OcrProvider } from "../types/provider";

/** Registro padrão de provedores OCR. */
export function createDefaultOcrProviders(): Map<string, OcrProvider> {
  const providers = new Map<string, OcrProvider>();
  providers.set("azure_document_intelligence", new AzureDocumentIntelligenceProvider());
  providers.set("gpt4_vision", new Gpt4VisionProvider());
  providers.set("tesseract", new TesseractProvider());
  return providers;
}
