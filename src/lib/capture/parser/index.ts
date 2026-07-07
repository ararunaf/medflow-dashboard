/**
 * Parser TISS — exports públicos.
 * MEDICFLOW-TISS-PARSER-01
 */
export type { TissGuideType, GuideTypeDetection } from "./types/tiss-guide-type";
export {
  STRUCTURED_FIELD_GROUPS,
  STRUCTURED_FIELD_STATUSES,
  STRUCTURED_GUIDE_GROUP_LABELS,
  type StructuredField,
  type StructuredFieldGroup,
  type StructuredFieldStatus,
  type StructuredFieldPosition,
  type StructuredFieldOcrOrigin,
  type StructuredProcedureLine,
  type StructuredGuide,
  type StructuredGuideMetadata,
  type StructuredGuideSummary,
} from "./types/structured-guide";

export {
  normalizeCpf,
  normalizeCns,
  normalizeCrm,
  normalizeCro,
  normalizeDate,
  normalizePhone,
  normalizeCid,
  normalizeTuss,
  normalizeGuideNumber,
  normalizeCnpj,
  normalizeAnsCode,
  normalizeCardNumber,
  normalizeName,
  normalizeCurrency,
  applyNormalizer,
  type NormalizerType,
} from "./normalizers";

export {
  ALL_TEMPLATES,
  TEMPLATE_CONSULTA_V1,
  TEMPLATE_SADT_V1,
  TEMPLATE_HONORARIO_V1,
  getTemplateForGuideType,
  type TissTemplate,
  type TemplateFieldDef,
} from "./templates";

export {
  TissParser,
  PARSER_VERSION,
  getDefaultTissParser,
  parseOcrToStructuredGuide,
} from "./engine/tiss-parser";

export { detectGuideType } from "./engine/guide-type-detector";

export {
  STRUCTURED_GUIDE_FILENAME,
  buildStructuredGuideStoragePath,
  persistStructuredGuide,
  loadStructuredGuide,
  getStructuredGuideSignedUrl,
  buildStructuredGuideSummaryFromResult,
  buildStructuredGuideSummaryFromMetadata,
} from "./infrastructure/parser-storage";

export {
  TissParserService,
  getDefaultTissParserService,
  runCaptureParser,
  getCaptureStructuredGuide,
  type RunCaptureParserResult,
} from "./services/tiss-parser-service";
