/**
 * Utilitários compartilhados entre provedores OCR.
 */
import type { JsonObject } from "@/lib/database.types";
import type {
  OcrBoundingBox,
  OcrCoordinates,
  OcrLine,
  OcrPage,
  OcrWord,
  RawOcrResult,
} from "../types/raw-ocr-result";

export function polygonToBoundingBox(polygon: number[]): OcrBoundingBox {
  if (!polygon.length) return { x: 0, y: 0, width: 0, height: 0 };
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < polygon.length; i += 2) {
    xs.push(polygon[i] ?? 0);
    ys.push(polygon[i + 1] ?? 0);
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function buildCoordinates(polygon?: number[]): OcrCoordinates {
  const box = polygon?.length ? polygonToBoundingBox(polygon) : { x: 0, y: 0, width: 0, height: 0 };
  return { polygon, boundingBox: box };
}

export function averageConfidence(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function countWords(pages: OcrPage[]): number {
  return pages.reduce((sum, p) => sum + p.words.length, 0);
}

export function buildRawOcrResult(params: {
  fullText: string;
  pages: OcrPage[];
  provider: string;
  providerVersion: string;
  processingTimeMs: number;
  metadata?: JsonObject;
}): RawOcrResult {
  const confidences = params.pages.flatMap((p) => p.words.map((w) => w.confidence));
  return {
    fullText: params.fullText,
    pages: params.pages,
    averageConfidence: averageConfidence(confidences),
    provider: params.provider,
    providerVersion: params.providerVersion,
    processingTimeMs: params.processingTimeMs,
    wordCount: countWords(params.pages),
    pageCount: params.pages.length,
    metadata: (params.metadata ?? {}) as JsonObject,
  };
}

export function mapAzureWord(word: {
  content?: string;
  confidence?: number;
  polygon?: number[];
}): OcrWord {
  return {
    text: word.content ?? "",
    confidence: word.confidence ?? 0,
    coordinates: buildCoordinates(word.polygon),
  };
}

export function mapAzureLine(
  line: { content?: string; polygon?: number[] },
  words: OcrWord[],
): OcrLine {
  const confidences = words.map((w) => w.confidence);
  return {
    text: line.content ?? "",
    confidence: averageConfidence(confidences),
    coordinates: buildCoordinates(line.polygon),
    words,
  };
}

export const CAPTURE_OCR_MAX_BYTES = 25 * 1024 * 1024;
export const CAPTURE_OCR_SUPPORTED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const;

/**
 * @deprecated OCR-01 — credenciais resolvidas exclusivamente no
 * AzureDocumentIntelligenceAdapter (Enterprise). Mantido como reexport
 * para compatibilidade de imports de produto/testes.
 */
export { resolveAzureDocumentIntelligenceConfig as resolveAzureConfig } from "@/lib/enterprise/ocr-provider";
