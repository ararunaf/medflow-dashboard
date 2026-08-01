/**
 * Pontos de extensão para futura normalização — EPC-15 FASE 8.
 *
 * IMPORTANTE: NADA neste arquivo é implementado nesta sprint.
 * Apenas documenta contratos estruturais onde a normalização poderá
 * ser conectada futuramente, SEM alterar a arquitetura do OCR Provider.
 *
 * Princípio:
 *   OCR produz ProcessingOutput (extração bruta canônica).
 *   Normalização (futura) consome ProcessingOutput e produz outro
 *   ProcessingOutput / artefato normalizado — FORA do OCR Provider.
 *
 * O OCR NUNCA normaliza. O OCR NUNCA interpreta. O OCR NUNCA valida.
 */

import type { ProcessingOutput } from "../../document-processor/ports/types";
import type { OCRProcessResult } from "./types";

/**
 * EXTENSION POINT 1 — Pós-processamento Application-level
 *
 * Local previsto:
 *   Application orquestra:
 *     1) OCRProviderPort.process() → OCRProcessResult (ProcessingOutput)
 *     2) [FUTURO] NormalizationPort.normalize(output) → ProcessingOutput
 *     3) DocumentProcessorPort.process({ processorType: "OCR", output })
 *
 * O OCR Provider NÃO importa nem chama NormalizationPort.
 */
export type FutureNormalizationApplicationHook = {
  /** Marcador documental — sem implementação. */
  readonly kind: "application-orchestration";
  /** Descrição do ponto de conexão. */
  readonly description: string;
};

/**
 * EXTENSION POINT 2 — Hook opcional no resultado OCR
 *
 * Campo estrutural reservado em customAttributes / tags do
 * DocumentProcessingResult para sinalizar "awaiting-normalization".
 * Sem lógica nesta sprint.
 */
export const FUTURE_NORMALIZATION_TAG = "awaiting-normalization" as const;

/**
 * EXTENSION POINT 3 — Contrato futuro de normalização (não implementado)
 *
 * Interface documental. NÃO existe adapter, factory ou registry.
 * Quando implementada em sprint futura, viverá em módulo separado
 * (ex.: `normalization/`) e consumirá ProcessingOutput canônico.
 */
export type FutureNormalizationPort = {
  /**
   * @deprecated Não implementar nesta sprint.
   * Assinatura prevista apenas para documentação arquitetural.
   */
  normalize(output: ProcessingOutput): Promise<ProcessingOutput>;
};

/**
 * EXTENSION POINT 4 — Ponte OCR → Document Processing Foundation
 *
 * Application futura:
 *   const ocr = await ocrPort.process(input);
 *   await documentProcessorPort.process({
 *     processing: {
 *       ...ocr.processing,
 *       // tags futuras: [FUTURE_NORMALIZATION_TAG]
 *     },
 *     output: ocr.output,
 *   });
 *
 * OCR NÃO importa DocumentProcessorPort adapters/store.
 * Apenas reutiliza os tipos canônicos (ProcessingOutput, etc.).
 */
export type FutureDocumentProcessingBridge = {
  readonly kind: "ocr-to-document-processing";
  readonly description: string;
};

/** Catálogo documental dos pontos de extensão (FASE 8). */
export const OCR_NORMALIZATION_EXTENSION_POINTS: readonly {
  id: string;
  title: string;
  implemented: false;
  description: string;
}[] = [
  {
    id: "EP-NORM-01",
    title: "Application orchestration after OCRProviderPort.process",
    implemented: false,
    description: "Application chama NormalizationPort futuro após obter ProcessingOutput do OCR.",
  },
  {
    id: "EP-NORM-02",
    title: "DocumentProcessingResult tag awaiting-normalization",
    implemented: false,
    description: "Tag estrutural reservada para sinalizar que o output aguarda normalização.",
  },
  {
    id: "EP-NORM-03",
    title: "FutureNormalizationPort (módulo separado)",
    implemented: false,
    description: "Port futuro em módulo próprio; consome e produz ProcessingOutput canônico.",
  },
  {
    id: "EP-NORM-04",
    title: "Bridge OCR → DocumentProcessorPort.process",
    implemented: false,
    description: "Application registra o ProcessingOutput OCR na Document Processing Foundation.",
  },
] as const;

/**
 * Helper documental — extrai o ProcessingOutput de um OCRProcessResult
 * para consumo por camadas futuras (normalização / foundation).
 * Não normaliza; apenas projeta o campo canônico.
 */
export function extractCanonicalOutput(result: OCRProcessResult): ProcessingOutput {
  return result.output;
}
