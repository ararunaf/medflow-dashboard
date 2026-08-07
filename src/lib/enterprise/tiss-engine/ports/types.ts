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

export interface CanonicalTissSerializer {
  kind: "tiss-serializer";
  serializerId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissSerializerInput {
  serializer: CanonicalTissSerializer;
}

export interface RegisterTissSerializerResult {
  ok: boolean;
  code: string;
  message: string;
  serializerId?: string;
  serializer?: CanonicalTissSerializer | null;
}

export interface GetTissSerializerInput {
  serializerId: string;
}

export interface GetTissSerializerResult {
  ok: boolean;
  code: string;
  message: string;
  serializer?: CanonicalTissSerializer | null;
}

export interface ListTissSerializersInput {
  tag?: string;
}

export interface ListTissSerializersResult {
  ok: boolean;
  code: string;
  message: string;
  serializers: CanonicalTissSerializer[];
}

export interface SerializeTissInput {
  serializerId: string;
  result: CanonicalTissParseResult;
}

export interface SerializeTissResult {
  ok: boolean;
  code: string;
  message: string;
  document: string | null;
}

export interface GetTissSerializerStatsInput {
  tag?: string;
}

export interface GetTissSerializerStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    serializerIds: string[];
  };
}

export interface CanonicalTissSchemaValidation {
  kind: "tiss-schema-validation";
  schemaValidationId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  serializerId: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissSchemaValidationInput {
  schemaValidation: CanonicalTissSchemaValidation;
}

export interface RegisterTissSchemaValidationResult {
  ok: boolean;
  code: string;
  message: string;
  schemaValidationId?: string;
  schemaValidation?: CanonicalTissSchemaValidation | null;
}

export interface GetTissSchemaValidationInput {
  schemaValidationId: string;
}

export interface GetTissSchemaValidationResult {
  ok: boolean;
  code: string;
  message: string;
  schemaValidation?: CanonicalTissSchemaValidation | null;
}

export interface ListTissSchemaValidationsInput {
  tag?: string;
}

export interface ListTissSchemaValidationsResult {
  ok: boolean;
  code: string;
  message: string;
  schemaValidations: CanonicalTissSchemaValidation[];
}

export interface ValidateTissSchemaInput {
  schemaValidationId: string;
  document: string;
}

export interface ValidateTissSchemaResult {
  ok: boolean;
  code: string;
  message: string;
  details: string[];
}

export interface GetTissSchemaValidationStatsInput {
  tag?: string;
}

export interface GetTissSchemaValidationStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    schemaValidationIds: string[];
  };
}

export interface CanonicalTissBusinessRule {
  field: string;
  expectedValue: string;
}

export interface CanonicalTissBusinessValidation {
  kind: "tiss-business-validation";
  businessValidationId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  serializerId: string;
  schemaValidationId: string;
  rule: CanonicalTissBusinessRule;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissBusinessValidationInput {
  businessValidation: CanonicalTissBusinessValidation;
}

export interface RegisterTissBusinessValidationResult {
  ok: boolean;
  code: string;
  message: string;
  businessValidationId?: string;
  businessValidation?: CanonicalTissBusinessValidation | null;
}

export interface GetTissBusinessValidationInput {
  businessValidationId: string;
}

export interface GetTissBusinessValidationResult {
  ok: boolean;
  code: string;
  message: string;
  businessValidation?: CanonicalTissBusinessValidation | null;
}

export interface ListTissBusinessValidationsInput {
  tag?: string;
}

export interface ListTissBusinessValidationsResult {
  ok: boolean;
  code: string;
  message: string;
  businessValidations: CanonicalTissBusinessValidation[];
}

export interface ValidateTissBusinessInput {
  businessValidationId: string;
  document: string;
  facts: Record<string, string>;
}

export interface ValidateTissBusinessResult {
  ok: boolean;
  code: string;
  message: string;
  details: string[];
}

export interface GetTissBusinessValidationStatsInput {
  tag?: string;
}

export interface GetTissBusinessValidationStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    businessValidationIds: string[];
  };
}

export interface CanonicalTissOperatorRule {
  field: string;
  expectedValue: string;
}

export interface CanonicalTissOperatorValidation {
  kind: "tiss-operator-validation";
  operatorValidationId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  serializerId: string;
  schemaValidationId: string;
  businessValidationId: string;
  operatorId: string;
  rule: CanonicalTissOperatorRule;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissOperatorValidationInput {
  operatorValidation: CanonicalTissOperatorValidation;
}

export interface RegisterTissOperatorValidationResult {
  ok: boolean;
  code: string;
  message: string;
  operatorValidationId?: string;
  operatorValidation?: CanonicalTissOperatorValidation | null;
}

export interface GetTissOperatorValidationInput {
  operatorValidationId: string;
}

export interface GetTissOperatorValidationResult {
  ok: boolean;
  code: string;
  message: string;
  operatorValidation?: CanonicalTissOperatorValidation | null;
}

export interface GetTissOperatorValidationInput {
  operatorValidationId: string;
}

export interface GetTissOperatorValidationResult {
  ok: boolean;
  code: string;
  message: string;
  operatorValidation?: CanonicalTissOperatorValidation | null;
}

export interface ListTissOperatorValidationsInput {
  tag?: string;
}

export interface ListTissOperatorValidationsResult {
  ok: boolean;
  code: string;
  message: string;
  operatorValidations: CanonicalTissOperatorValidation[];
}

export interface ValidateTissOperatorInput {
  operatorValidationId: string;
  document: string;
  operatorId: string;
  facts: Record<string, string>;
}

export interface ValidateTissOperatorResult {
  ok: boolean;
  code: string;
  message: string;
  details: string[];
}

export interface UpdateTissOperatorValidationInput {
  operatorValidationId: string;
  operatorValidation: Partial<CanonicalTissOperatorValidation>;
}

export interface UpdateTissOperatorValidationResult {
  ok: boolean;
  code: string;
  message: string;
  operatorValidation?: CanonicalTissOperatorValidation | null;
}

export interface RemoveTissOperatorValidationInput {
  operatorValidationId: string;
}

export interface RemoveTissOperatorValidationResult {
  ok: boolean;
  code: string;
  message: string;
}

export interface GetTissOperatorValidationStatsInput {
  tag?: string;
}

export interface GetTissOperatorValidationStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    operatorValidationIds: string[];
  };
}

export interface CanonicalTissRepairRule {
  type: string;
  options: Record<string, string>;
}

export interface CanonicalTissRepair {
  kind: "tiss-repair";
  repairId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  serializerId: string;
  schemaValidationId: string;
  businessValidationId: string;
  operatorValidationId: string;
  rule: CanonicalTissRepairRule;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissRepairInput {
  repair: CanonicalTissRepair;
}

export interface RegisterTissRepairResult {
  ok: boolean;
  code: string;
  message: string;
  repairId?: string;
  repair?: CanonicalTissRepair | null;
}

export interface GetTissRepairInput {
  repairId: string;
}

export interface GetTissRepairResult {
  ok: boolean;
  code: string;
  message: string;
  repair?: CanonicalTissRepair | null;
}

export interface ListTissRepairsInput {
  tag?: string;
}

export interface ListTissRepairsResult {
  ok: boolean;
  code: string;
  message: string;
  repairs: CanonicalTissRepair[];
}

export interface UpdateTissRepairInput {
  repairId: string;
  repair: Partial<CanonicalTissRepair>;
}

export interface UpdateTissRepairResult {
  ok: boolean;
  code: string;
  message: string;
  repair?: CanonicalTissRepair | null;
}

export interface RemoveTissRepairInput {
  repairId: string;
}

export interface RemoveTissRepairResult {
  ok: boolean;
  code: string;
  message: string;
}

export interface RepairTissInput {
  repairId: string;
  document: string;
}

export interface RepairTissResult {
  ok: boolean;
  code: string;
  message: string;
  document?: string | null;
  details?: string[];
}

export interface GetTissRepairStatsInput {
  tag?: string;
}

export interface GetTissRepairStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    repairIds: string[];
  };
}

export interface CanonicalTissCorrectionRule {
  type: string;
  options: Record<string, string>;
}

export interface CanonicalTissCorrection {
  kind: "tiss-correction";
  correctionId: string;
  name: string;
  knowledgeId: string;
  layoutId: string;
  parserId: string;
  serializerId: string;
  schemaValidationId: string;
  businessValidationId: string;
  operatorValidationId: string;
  repairId: string;
  rule: CanonicalTissCorrectionRule;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface RegisterTissCorrectionInput {
  correction: CanonicalTissCorrection;
}

export interface RegisterTissCorrectionResult {
  ok: boolean;
  code: string;
  message: string;
  correctionId?: string;
  correction?: CanonicalTissCorrection | null;
}

export interface GetTissCorrectionInput {
  correctionId: string;
}

export interface GetTissCorrectionResult {
  ok: boolean;
  code: string;
  message: string;
  correction?: CanonicalTissCorrection | null;
}

export interface ListTissCorrectionsInput {
  tag?: string;
}

export interface ListTissCorrectionsResult {
  ok: boolean;
  code: string;
  message: string;
  corrections: CanonicalTissCorrection[];
}

export interface UpdateTissCorrectionInput {
  correctionId: string;
  correction: Partial<CanonicalTissCorrection>;
}

export interface UpdateTissCorrectionResult {
  ok: boolean;
  code: string;
  message: string;
  correction?: CanonicalTissCorrection | null;
}

export interface RemoveTissCorrectionInput {
  correctionId: string;
}

export interface RemoveTissCorrectionResult {
  ok: boolean;
  code: string;
  message: string;
}

export interface CorrectTissInput {
  correctionId: string;
  document: string;
}

export interface CorrectTissResult {
  ok: boolean;
  code: string;
  message: string;
  document?: string | null;
  details?: string[];
}

export interface GetTissCorrectionStatsInput {
  tag?: string;
}

export interface GetTissCorrectionStatsResult {
  ok: boolean;
  code: string;
  message: string;
  stats: {
    total: number;
    byTag: Record<string, number>;
    correctionIds: string[];
  };
}
