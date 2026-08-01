/**
 * Helpers de referências opacas — EPC-13.
 *
 * Sem resolução, sem import de Engines externos, sem OCR / IA / Workflow.
 */
import type {
  DocumentProcessingResult,
  ProcessingDocumentIdentityReference,
  ProcessingMetadataReference,
  ProcessingOpaqueReference,
  ProcessingOutputReference,
  ProcessingStorageReference,
  ProcessingWarning,
  ProcessingError,
} from "./types";

export function defineMetadataReference(
  partial: ProcessingMetadataReference = {},
): ProcessingMetadataReference {
  return { ...partial };
}

export function defineDocumentIdentityReference(
  partial: ProcessingDocumentIdentityReference = {},
): ProcessingDocumentIdentityReference {
  return { ...partial };
}

export function defineOutputReference(
  partial: ProcessingOutputReference = {},
): ProcessingOutputReference {
  return { ...partial };
}

export function defineStorageReference(
  partial: ProcessingStorageReference = {},
): ProcessingStorageReference {
  return { ...partial };
}

export function defineOpaqueReference(
  partial: ProcessingOpaqueReference = {},
): ProcessingOpaqueReference {
  return { ...partial };
}

export function defineWarning(partial: ProcessingWarning = {}): ProcessingWarning {
  return { ...partial };
}

export function defineError(partial: ProcessingError = {}): ProcessingError {
  return { ...partial };
}

export function referencesDocument(
  processing: DocumentProcessingResult,
  documentId: string,
): boolean {
  return processing.documentIdentityReference?.documentId === documentId;
}

export function referencesOutput(processing: DocumentProcessingResult, outputId: string): boolean {
  return processing.outputReference?.outputId === outputId;
}
