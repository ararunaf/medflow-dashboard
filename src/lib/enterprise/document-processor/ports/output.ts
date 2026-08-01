/**
 * Helpers de ProcessingOutput — EPC-13 FASE 8.
 *
 * Definição / inspeção estrutural apenas. Sem OCR, parsers ou I/O.
 */
import type { ProcessingOutput, ProcessingOutputAttachment, ProcessingOutputPage } from "./types";

export function defineProcessingOutput(
  partial: Partial<ProcessingOutput> & { outputId: string },
): ProcessingOutput {
  return { ...partial, outputId: partial.outputId };
}

export function defineOutputPage(partial: ProcessingOutputPage = {}): ProcessingOutputPage {
  return { ...partial };
}

export function defineOutputAttachment(
  partial: ProcessingOutputAttachment = {},
): ProcessingOutputAttachment {
  return { ...partial };
}

export function getOutputPageCount(output: ProcessingOutput): number {
  return output.pages?.length ?? 0;
}

export function getOutputAttachmentCount(output: ProcessingOutput): number {
  return output.attachments?.length ?? 0;
}
