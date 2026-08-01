/**
 * Helpers de ProcessorType — EPC-13 FASE 7.
 *
 * Somente enumeração / inspeção estrutural. Sem lógica de OCR, XML, PDF,
 * Barcode, QRCode, HL7, DICOM ou I/O.
 */
import type { DocumentProcessingResult, ProcessorType } from "./types";
import { PROCESSOR_TYPES } from "./types";

/** True se o ProcessorType é um dos conhecidos (FASE 7). */
export function hasKnownProcessorType(processorType: ProcessorType): boolean {
  return (PROCESSOR_TYPES as readonly string[]).includes(processorType);
}

/** True se o resultado declara um ProcessorType conhecido. */
export function processingHasKnownProcessorType(processing: DocumentProcessingResult): boolean {
  return hasKnownProcessorType(processing.processorType);
}

/** Lista os ProcessorTypes canônicos (cópia estrutural). */
export function listProcessorTypes(): readonly ProcessorType[] {
  return [...PROCESSOR_TYPES];
}
