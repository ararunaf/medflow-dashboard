/**
 * ProviderDescriptor OCR — EPC-15 FASE 5.
 *
 * Constrói o descriptor canônico do Processing Provider Framework (EPC-14)
 * para o OCR Provider. ProviderType = "OCR".
 *
 * Campos mínimos:
 *   ProviderId | ProviderName | ProviderVersion | ProviderType=OCR |
 *   Capabilities | Priority | Enabled | ConfigurationReference | MetadataReference
 *
 * Sem lógica de execução. Sem OCR real.
 */
import type {
  ProviderCapabilities,
  ProviderConfigurationReference,
  ProviderDescriptor,
  ProviderMetadataReference,
} from "../../processing-provider/ports/types";
import { DEFAULT_MOCK_OCR_CAPABILITIES, type OCRCapabilities } from "../ports/capabilities";

export const DEFAULT_MOCK_OCR_PROVIDER_ID = "ocr-mock";
export const DEFAULT_MOCK_OCR_PROVIDER_NAME = "Default Mock OCR Provider";
export const DEFAULT_MOCK_OCR_PROVIDER_VERSION = "1.0.0";

/**
 * Mapeia OCRCapabilities → ProviderCapabilities (EPC-14).
 * Apenas projeção estrutural — sem lógica.
 */
export function mapOCRCapabilitiesToProviderCapabilities(
  ocr: OCRCapabilities,
): ProviderCapabilities {
  return {
    supportedInputs: ocr.supportedFormats,
    supportedOutputs: ["processing-output"],
    supportedLanguages: ocr.supportedLanguages,
    supportsAsync: ocr.supportsAsync,
    supportsBatch: ocr.supportsBatch,
    supportsConfidence: ocr.supportsConfidence,
    supportsMetadata: true,
    supportsAttachments: false,
    maxDocumentSize: ocr.maxFileSize,
  };
}

export type BuildOCRProviderDescriptorInput = {
  providerId?: string;
  providerName?: string;
  providerVersion?: string;
  capabilities?: OCRCapabilities;
  priority?: number;
  enabled?: boolean;
  configurationReference?: ProviderConfigurationReference;
  metadataReference?: ProviderMetadataReference;
  tags?: readonly string[];
};

/**
 * Constrói um ProviderDescriptor canônico com providerType = "OCR".
 */
export function buildOCRProviderDescriptor(
  input: BuildOCRProviderDescriptorInput = {},
): ProviderDescriptor {
  const ocrCapabilities = input.capabilities ?? DEFAULT_MOCK_OCR_CAPABILITIES;
  return {
    providerId: input.providerId ?? DEFAULT_MOCK_OCR_PROVIDER_ID,
    providerName: input.providerName ?? DEFAULT_MOCK_OCR_PROVIDER_NAME,
    providerVersion: input.providerVersion ?? DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    providerType: "OCR",
    capabilities: mapOCRCapabilitiesToProviderCapabilities(ocrCapabilities),
    priority: input.priority ?? 100,
    enabled: input.enabled ?? true,
    healthStatus: "ready",
    configurationReference: input.configurationReference ?? {
      kind: "ocr-provider-configuration",
      id: "ocr-mock-config",
      version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    },
    metadataReference: input.metadataReference ?? {
      kind: "ocr-provider-metadata",
      id: "ocr-mock-metadata",
      name: DEFAULT_MOCK_OCR_PROVIDER_NAME,
      version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    },
    tags: input.tags ?? ["ocr", "extraction", "foundation"],
    customAttributes: {
      component: "ocr-provider",
      epc: "EPC-15",
      realOcr: false,
      http: false,
      ai: false,
    },
  };
}

/** Descriptor canônico do DefaultMockOCRProvider para o Registry EPC-14. */
export function createDefaultMockOCRProviderDescriptor(): ProviderDescriptor {
  return buildOCRProviderDescriptor();
}
