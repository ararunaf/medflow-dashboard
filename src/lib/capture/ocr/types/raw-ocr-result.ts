/**
 * Modelo de saída OCR bruta — sem parser, sem campos TISS.
 * MEDICFLOW-OCR-IMPLEMENTATION-01
 */

import type { JsonObject } from "@/lib/database.types";

export type OcrBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OcrCoordinates = {
  polygon?: number[];
  boundingBox: OcrBoundingBox;
};

export type OcrWord = {
  text: string;
  confidence: number;
  coordinates: OcrCoordinates;
};

export type OcrLine = {
  text: string;
  confidence: number;
  coordinates: OcrCoordinates;
  words: OcrWord[];
};

export type OcrPage = {
  pageNumber: number;
  width: number;
  height: number;
  unit: string;
  lines: OcrLine[];
  words: OcrWord[];
  rawText: string;
};

/** Resultado OCR unificado — persistido como ocr_result.json */
export type RawOcrResult = {
  fullText: string;
  pages: OcrPage[];
  averageConfidence: number;
  provider: string;
  providerVersion: string;
  processingTimeMs: number;
  wordCount: number;
  pageCount: number;
  metadata: JsonObject;
};

export type OcrResultSummary = {
  status: "pending" | "completed" | "failed";
  provider?: string;
  processingTimeMs?: number;
  averageConfidence?: number;
  pageCount?: number;
  wordCount?: number;
  storagePath?: string;
  error?: string;
};
