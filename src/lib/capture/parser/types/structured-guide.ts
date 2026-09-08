/**
 * Modelo estruturado de guia TISS — saída do TissParser.
 * MEDICFLOW-TISS-PARSER-01
 */
import type { OcrBoundingBox } from "../../ocr/types/raw-ocr-result";
import type { TissGuideType, GuideTypeDetection } from "./tiss-guide-type";

export const STRUCTURED_FIELD_GROUPS = [
  "paciente",
  "operadora",
  "prestador",
  "solicitante",
  "executante",
  "procedimentos",
  "diagnostico",
  "autorizacoes",
  "datas",
  "assinaturas",
  "observacoes",
] as const;

export type StructuredFieldGroup = (typeof STRUCTURED_FIELD_GROUPS)[number];

export const STRUCTURED_FIELD_STATUSES = [
  "found",
  "missing",
  "partial",
  "duplicate",
  "out_of_position",
] as const;

export type StructuredFieldStatus = (typeof STRUCTURED_FIELD_STATUSES)[number];

export type StructuredFieldPosition = {
  page: number;
  lineIndex: number;
  boundingBox: OcrBoundingBox;
  /** Coordenadas normalizadas 0–1 relativas à página */
  normalized: { x: number; y: number; width: number; height: number };
};

/**
 * Metadados de proveniência OCR do campo — sem o texto bruto da linha
 * (SEC-PII-01: `lineText`/`wordTexts` duplicavam PII já presente em
 * `rawValue`/`value` e não tinham consumidor além de dois asserts de teste).
 */
export type StructuredFieldOcrOrigin = {
  provider: string;
  lineConfidence: number;
};

export type StructuredField = {
  code: string;
  label: string;
  group: StructuredFieldGroup;
  value: string | null;
  rawValue: string | null;
  confidence: number;
  position: StructuredFieldPosition | null;
  ocrOrigin: StructuredFieldOcrOrigin | null;
  status: StructuredFieldStatus;
  normalized: boolean;
};

export type StructuredProcedureLine = {
  lineNumber: number;
  fields: Record<string, StructuredField>;
  confidence: number;
};

export type StructuredGuideMetadata = {
  sessionId?: string;
  pageCount: number;
  parserVersion: string;
  parserDurationMs: number;
  ocrProvider: string;
  ocrAverageConfidence: number;
  overallConfidence: number;
  fieldsFound: number;
  fieldsMissing: number;
  fieldsPartial: number;
  fieldsDuplicate: number;
  fieldsOutOfPosition: number;
};

/** Guia estruturada — persistida como structured_guide.json */
export type StructuredGuide = {
  version: "structured_guide_v1";
  guideType: TissGuideType;
  classification: GuideTypeDetection;
  groups: Record<StructuredFieldGroup, StructuredField[]>;
  fields: Record<string, StructuredField>;
  procedures: StructuredProcedureLine[];
  metadata: StructuredGuideMetadata;
};

export type StructuredGuideSummary = {
  status: "pending" | "completed" | "failed";
  guideType?: TissGuideType;
  guideTypeConfidence?: number;
  overallConfidence?: number;
  fieldsFound?: number;
  fieldsMissing?: number;
  fieldsPartial?: number;
  storagePath?: string;
  parserDurationMs?: number;
  error?: string;
};

export const STRUCTURED_GUIDE_GROUP_LABELS: Record<StructuredFieldGroup, string> = {
  paciente: "Paciente",
  operadora: "Operadora",
  prestador: "Prestador",
  solicitante: "Solicitante",
  executante: "Executante",
  procedimentos: "Procedimentos",
  diagnostico: "Diagnóstico",
  autorizacoes: "Autorizações",
  datas: "Datas",
  assinaturas: "Assinaturas",
  observacoes: "Observações",
};
