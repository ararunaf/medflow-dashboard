/**
 * Tipos de guia TISS suportados pelo parser v1.
 * MEDICFLOW-TISS-PARSER-01
 */

export const TISS_GUIDE_TYPES = [
  "guia_consulta",
  "guia_sadt",
  "guia_honorario",
  "unknown",
] as const;

export type TissGuideType = (typeof TISS_GUIDE_TYPES)[number];

export type GuideTypeDetection = {
  guideType: TissGuideType;
  confidence: number;
  method: "header_regex" | "layout_heuristic" | "unknown";
  alternativeTypes: Array<{ type: TissGuideType; confidence: number }>;
};
