/**
 * Utilitários compartilhados entre provedores OCR.
 */
import type { OcrBoundingBox, OcrCoordinates, OcrLine, OcrPage, OcrWord, RawOcrResult } from "../types/raw-ocr-result";

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
  metadata?: Record<string, unknown>;
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
    metadata: params.metadata ?? {},
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

export function resolveAzureConfig(): { endpoint: string; apiKey: string } | null {
  const endpoint =
    (typeof process !== "undefined" && process.env?.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT) ||
    (typeof process !== "undefined" && process.env?.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT);
  const apiKey =
    (typeof process !== "undefined" && process.env?.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY) ||
    (typeof process !== "undefined" && process.env?.AZURE_DOCUMENT_INTELLIGENCE_KEY);

  if (typeof endpoint === "string" && endpoint.length > 0 && typeof apiKey === "string" && apiKey.length > 0) {
    return { endpoint: endpoint.replace(/\/$/, ""), apiKey };
  }
  return null;
}
