/**
 * Registro do OCR Provider no Processing Provider Framework (EPC-14) — FASE 4.
 *
 * O Registry EPC-14 deverá reconhecê-lo como um Provider OCR
 * (providerType = "OCR").
 *
 * Sem execução. Sem OCR real. Sem bind a Document Processing adapters.
 */
import type { ProcessingProviderRegistry } from "../../processing-provider/registry/processing-provider-registry";
import type { ProviderDescriptor } from "../../processing-provider/ports/types";
import { createDefaultMockOCRProviderDescriptor } from "../descriptor/ocr-provider-descriptor";

export type RegisterOCRWithProcessingFrameworkResult = {
  ok: boolean;
  providerId: string;
  providerType: "OCR";
  provider: ProviderDescriptor;
  message: string;
};

/**
 * Registra o Default Mock OCR Provider no ProcessingProviderRegistry.
 * Idempotente — sobrescreve descriptor existente com o mesmo providerId.
 */
export function registerOCRProviderWithProcessingFramework(
  registry: ProcessingProviderRegistry,
  descriptor: ProviderDescriptor = createDefaultMockOCRProviderDescriptor(),
): RegisterOCRWithProcessingFrameworkResult {
  if (descriptor.providerType !== "OCR") {
    throw new Error(
      `OCR Provider registration requer providerType "OCR"; recebido "${descriptor.providerType}".`,
    );
  }

  registry.register(descriptor);

  return {
    ok: true,
    providerId: descriptor.providerId,
    providerType: "OCR",
    provider: descriptor,
    message: `OCR Provider "${descriptor.providerId}" registrado no Processing Provider Framework.`,
  };
}

/**
 * Lista Providers OCR já registrados no Framework EPC-14.
 */
export function listOCRProvidersFromProcessingFramework(
  registry: ProcessingProviderRegistry,
): readonly ProviderDescriptor[] {
  return registry.listByType("OCR");
}
