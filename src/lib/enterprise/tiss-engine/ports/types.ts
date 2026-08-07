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
