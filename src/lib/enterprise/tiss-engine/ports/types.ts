/**
 * TISSEnterprise types — G-01.
 */

export interface TissEngineInfo {
  id: string;
  name: string;
  version: string;
  vendor: string;
  provider: string;
}

export interface TissEngineHealth {
  ok: boolean;
  tissEngineOk: boolean;
  tissKnowledgeOk: boolean;
  tissLayoutOk: boolean;
  tissParserOk: boolean;
  tissSerializerOk: boolean;
  tissSchemaValidationOk: boolean;
  tissBusinessValidationOk: boolean;
  tissOperatorValidationOk: boolean;
  tissRepairOk: boolean;
  tissCorrectionOk: boolean;
}

export interface CanonicalTissKnowledge {
  kind: "tiss-knowledge";
  knowledgeId: string;
  name: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface CanonicalTissKnowledgeResult {
  ok: boolean;
  code: string;
  message: string;
  knowledge?: CanonicalTissKnowledge;
  knowledgeId?: string;
}

export interface RegisterTissKnowledgeInput {
  knowledge: CanonicalTissKnowledge;
}

export interface RegisterTissKnowledgeResult {
  ok: boolean;
  code: string;
  message: string;
  knowledgeId?: string;
  knowledge?: CanonicalTissKnowledge | null;
}

export interface GetTissKnowledgeInput {
  knowledgeId: string;
}

export interface GetTissKnowledgeResult {
  ok: boolean;
  code: string;
  message: string;
  knowledge?: CanonicalTissKnowledge | null;
}

export interface ListTissKnowledgeInput {
  tag?: string;
}

export interface ListTissKnowledgeResult {
  ok: boolean;
  code: string;
  message: string;
  knowledges: CanonicalTissKnowledge[];
}

export interface SearchTissKnowledgeInput {
  query: string;
}

export interface SearchTissKnowledgeResult {
  ok: boolean;
  code: string;
  message: string;
  knowledges: CanonicalTissKnowledge[];
}

export interface GetTissKnowledgeStatsInput {
  tag?: string;
}

export interface GetTissKnowledgeStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    knowledgeIds: string[];
  };
}

export interface CanonicalTissLayout {
  kind: "tiss-layout";
  layoutId: string;
  name: string;
  knowledgeId: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissLayoutInput {
  layout: CanonicalTissLayout;
}

export interface RegisterTissLayoutResult {
  ok: boolean;
  code: string;
  message: string;
  layoutId?: string;
  layout?: CanonicalTissLayout | null;
}

export interface GetTissLayoutInput {
  layoutId: string;
}

export interface GetTissLayoutResult {
  ok: boolean;
  code: string;
  message: string;
  layout?: CanonicalTissLayout | null;
}

export interface ListTissLayoutInput {
  tag?: string;
}

export interface ListTissLayoutResult {
  ok: boolean;
  code: string;
  message: string;
  layouts: CanonicalTissLayout[];
}

export interface SearchTissLayoutInput {
  query: string;
}

export interface SearchTissLayoutResult {
  ok: boolean;
  code: string;
  message: string;
  layouts: CanonicalTissLayout[];
}

export interface GetTissLayoutStatsInput {
  tag?: string;
}

export interface GetTissLayoutStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    layoutIds: string[];
  };
}

export interface CanonicalTissParser {
  kind: "tiss-parser";
  parserId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface CanonicalTissParseResult {
  kind: "tiss-parse-result";
  parserId: string;
  knowledgeId: string;
  layoutId: string;
  root: string;
  elements: {
    tag: string;
    attributes: string;
    children: { tag: string; attributes: string; text: string }[];
  }[];
  raw: string;
}

export interface RegisterTissParserInput {
  parser: CanonicalTissParser;
}

export interface RegisterTissParserResult {
  ok: boolean;
  code: string;
  message: string;
  parserId?: string;
  parser?: CanonicalTissParser | null;
}

export interface GetTissParserInput {
  parserId: string;
}

export interface GetTissParserResult {
  ok: boolean;
  code: string;
  message: string;
  parser?: CanonicalTissParser | null;
}

export interface ListTissParsersInput {
  tag?: string;
}

export interface ListTissParsersResult {
  ok: boolean;
  code: string;
  message: string;
  parsers: CanonicalTissParser[];
}

export interface ParseTissInput {
  parserId: string;
  document: string;
}

export interface ParseTissResult {
  ok: boolean;
  code: string;
  message: string;
  result: CanonicalTissParseResult | null;
}

export interface GetTissParserStatsInput {
  tag?: string;
}

export interface GetTissParserStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    parserIds: string[];
  };
}
