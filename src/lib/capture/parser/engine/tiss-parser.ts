/**
 * TissParser — interpreta RawOcrResult e produz StructuredGuide.
 * MEDICFLOW-TISS-PARSER-01
 *
 * Responsabilidades:
 * - interpretar OCR
 * - localizar campos
 * - normalizar valores
 * - atribuir confidence por campo
 * - identificar ausência de campos
 *
 * NÃO valida regras de negócio.
 */
import type { RawOcrResult } from "../../ocr/types/raw-ocr-result";
import { getTemplateForGuideType } from "../templates";
import type { StructuredGuide } from "../types/structured-guide";
import { detectGuideType } from "./guide-type-detector";
import {
  computeOverallConfidence,
  countFieldsByStatus,
  extractFields,
  groupFields,
} from "./field-extractor";

export const PARSER_VERSION = "tiss_parser_v1";

export type TissParserOptions = {
  sessionId?: string;
};

export class TissParser {
  parse(ocr: RawOcrResult, options: TissParserOptions = {}): StructuredGuide {
    const start = Date.now();
    const classification = detectGuideType(ocr);
    const template = getTemplateForGuideType(classification.guideType);

    let fields: Record<string, import("../types/structured-guide").StructuredField> = {};
    let procedures: import("../types/structured-guide").StructuredProcedureLine[] = [];

    if (template) {
      const extracted = extractFields(ocr, template.fields);
      fields = extracted.fields;
      procedures = extracted.procedures;
    } else {
      const genericTemplate = getTemplateForGuideType("guia_consulta");
      if (genericTemplate) {
        const extracted = extractFields(ocr, genericTemplate.fields);
        fields = extracted.fields;
        procedures = extracted.procedures;
      }
    }

    const groups = groupFields(fields);
    const statusCounts = countFieldsByStatus(fields);
    const overallConfidence = computeOverallConfidence(fields);

    return {
      version: "structured_guide_v1",
      guideType: classification.guideType,
      classification,
      groups,
      fields,
      procedures,
      metadata: {
        sessionId: options.sessionId,
        pageCount: ocr.pageCount,
        parserVersion: PARSER_VERSION,
        parserDurationMs: Date.now() - start,
        ocrProvider: ocr.provider,
        ocrAverageConfidence: ocr.averageConfidence,
        overallConfidence,
        fieldsFound: statusCounts.found + statusCounts.outOfPosition,
        fieldsMissing: statusCounts.missing,
        fieldsPartial: statusCounts.partial,
        fieldsDuplicate: statusCounts.duplicate,
        fieldsOutOfPosition: statusCounts.outOfPosition,
      },
    };
  }

  detectGuideType(ocr: RawOcrResult) {
    return detectGuideType(ocr);
  }
}

let defaultParser: TissParser | null = null;

export function getDefaultTissParser(): TissParser {
  if (!defaultParser) defaultParser = new TissParser();
  return defaultParser;
}

export function parseOcrToStructuredGuide(
  ocr: RawOcrResult,
  options?: TissParserOptions,
): StructuredGuide {
  return getDefaultTissParser().parse(ocr, options);
}
