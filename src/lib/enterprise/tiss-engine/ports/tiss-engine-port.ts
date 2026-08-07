/**
 * TissEnginePort — G-01.
 *
 * Contrato único do Bloco G. Ativa G-01: TISS Knowledge.
 * Demais capabilities permanecem false.
 */
import type { TISSEnterpriseCapabilities } from "./capabilities";
import type {
  GetTissKnowledgeInput,
  GetTissKnowledgeResult,
  GetTissKnowledgeStatsInput,
  GetTissKnowledgeStatsResult,
  GetTissLayoutInput,
  GetTissLayoutResult,
  GetTissLayoutStatsInput,
  GetTissLayoutStatsResult,
  GetTissParserInput,
  GetTissParserResult,
  GetTissParserStatsInput,
  GetTissParserStatsResult,
  GetTissBusinessValidationInput,
  GetTissBusinessValidationResult,
  GetTissBusinessValidationStatsInput,
  GetTissBusinessValidationStatsResult,
  GetTissSchemaValidationInput,
  GetTissSchemaValidationResult,
  GetTissSchemaValidationStatsInput,
  GetTissSchemaValidationStatsResult,
  GetTissSerializerInput,
  GetTissSerializerResult,
  GetTissSerializerStatsInput,
  GetTissSerializerStatsResult,
  GetTissOperatorValidationInput,
  GetTissOperatorValidationResult,
  GetTissOperatorValidationStatsInput,
  GetTissOperatorValidationStatsResult,
  GetTissRepairInput,
  GetTissRepairResult,
  GetTissRepairStatsInput,
  GetTissRepairStatsResult,
  ListTissRepairsInput,
  ListTissRepairsResult,
  RegisterTissRepairInput,
  RegisterTissRepairResult,
  RemoveTissRepairInput,
  RemoveTissRepairResult,
  RepairTissInput,
  RepairTissResult,
  UpdateTissRepairInput,
  UpdateTissRepairResult,
  ListTissKnowledgeInput,
  ListTissKnowledgeResult,
  ListTissLayoutInput,
  ListTissLayoutResult,
  ListTissBusinessValidationsInput,
  ListTissBusinessValidationsResult,
  ListTissOperatorValidationsInput,
  ListTissOperatorValidationsResult,
  ListTissParsersInput,
  ListTissParsersResult,
  ListTissSchemaValidationsInput,
  ListTissSchemaValidationsResult,
  ListTissSerializersInput,
  ListTissSerializersResult,
  ParseTissInput,
  ParseTissResult,
  RegisterTissKnowledgeInput,
  RegisterTissKnowledgeResult,
  RegisterTissLayoutInput,
  RegisterTissLayoutResult,
  RegisterTissParserInput,
  RegisterTissParserResult,
  RegisterTissBusinessValidationInput,
  RegisterTissBusinessValidationResult,
  RegisterTissOperatorValidationInput,
  RegisterTissOperatorValidationResult,
  RegisterTissSchemaValidationInput,
  RemoveTissOperatorValidationInput,
  RemoveTissOperatorValidationResult,
  UpdateTissOperatorValidationInput,
  UpdateTissOperatorValidationResult,
  RegisterTissSchemaValidationResult,
  RegisterTissSerializerInput,
  RegisterTissSerializerResult,
  SearchTissKnowledgeInput,
  SearchTissKnowledgeResult,
  SearchTissLayoutInput,
  SearchTissLayoutResult,
  SerializeTissInput,
  ValidateTissBusinessInput,
  ValidateTissBusinessResult,
  ValidateTissOperatorInput,
  ValidateTissOperatorResult,
  ValidateTissSchemaInput,
  ValidateTissSchemaResult,
  SerializeTissResult,
  TissEngineHealth,
  TissEngineInfo,
  RegisterTissCorrectionInput,
  RegisterTissCorrectionResult,
  GetTissCorrectionInput,
  GetTissCorrectionResult,
  ListTissCorrectionsInput,
  ListTissCorrectionsResult,
  UpdateTissCorrectionInput,
  UpdateTissCorrectionResult,
  RemoveTissCorrectionInput,
  RemoveTissCorrectionResult,
  CorrectTissInput,
  CorrectTissResult,
  GetTissCorrectionStatsInput,
  GetTissCorrectionStatsResult,
} from "./types";

export interface TissEnginePort {
  /** G-01 — identidade do adapter/provider. */
  identity(): TissEngineInfo;

  /** G-01 — matriz de capabilities. */
  getCapabilities(): TISSEnterpriseCapabilities;

  /** G-01 — health check do engine. */
  health(): Promise<TissEngineHealth>;

  /** G-01 — registrar conhecimento TISS. */
  registerTissKnowledge(input: RegisterTissKnowledgeInput): Promise<RegisterTissKnowledgeResult>;

  /** G-01 — recuperar conhecimento por id. */
  getTissKnowledge(input: GetTissKnowledgeInput): Promise<GetTissKnowledgeResult>;

  /** G-01 — listar conhecimentos (opcionalmente por tag). */
  listTissKnowledge(input?: ListTissKnowledgeInput): Promise<ListTissKnowledgeResult>;

  /** G-01 — pesquisar conhecimentos por nome. */
  searchTissKnowledge(input: SearchTissKnowledgeInput): Promise<SearchTissKnowledgeResult>;

  /** G-01 — estatísticas do catálogo de conhecimento. */
  getTissKnowledgeStats(input?: GetTissKnowledgeStatsInput): Promise<GetTissKnowledgeStatsResult>;

  /** G-02 — registrar layout TISS. */
  registerTissLayout(input: RegisterTissLayoutInput): Promise<RegisterTissLayoutResult>;

  /** G-02 — recuperar layout por id. */
  getTissLayout(input: GetTissLayoutInput): Promise<GetTissLayoutResult>;

  /** G-02 — listar layouts. */
  listTissLayout(input?: ListTissLayoutInput): Promise<ListTissLayoutResult>;

  /** G-02 — pesquisar layouts. */
  searchTissLayout(input: SearchTissLayoutInput): Promise<SearchTissLayoutResult>;

  /** G-02 — estatísticas de layouts. */
  getTissLayoutStats(input?: GetTissLayoutStatsInput): Promise<GetTissLayoutStatsResult>;

  /** G-03 — registrar parser TISS. */
  registerTissParser(input: RegisterTissParserInput): Promise<RegisterTissParserResult>;

  /** G-03 — recuperar parser por id. */
  getTissParser(input: GetTissParserInput): Promise<GetTissParserResult>;

  /** G-03 — listar parsers. */
  listTissParsers(input?: ListTissParsersInput): Promise<ListTissParsersResult>;

  /** G-03 — converter documento TISS em representação canônica. */
  parseTiss(input: ParseTissInput): Promise<ParseTissResult>;

  /** G-03 — estatísticas de parsers. */
  getTissParserStats(input?: GetTissParserStatsInput): Promise<GetTissParserStatsResult>;

  /** G-04 — registrar serializer TISS. */
  registerTissSerializer(input: RegisterTissSerializerInput): Promise<RegisterTissSerializerResult>;

  /** G-04 — recuperar serializer por id. */
  getTissSerializer(input: GetTissSerializerInput): Promise<GetTissSerializerResult>;

  /** G-04 — listar serializers. */
  listTissSerializers(input?: ListTissSerializersInput): Promise<ListTissSerializersResult>;

  /** G-04 — serializar representação canônica em documento TISS. */
  serializeTiss(input: SerializeTissInput): Promise<SerializeTissResult>;

  /** G-04 — estatísticas de serializers. */
  getTissSerializerStats(
    input?: GetTissSerializerStatsInput,
  ): Promise<GetTissSerializerStatsResult>;

  /** G-05 — registrar validação de schema TISS. */
  registerTissSchemaValidation(
    input: RegisterTissSchemaValidationInput,
  ): Promise<RegisterTissSchemaValidationResult>;

  /** G-05 — recuperar validação de schema por id. */
  getTissSchemaValidation(
    input: GetTissSchemaValidationInput,
  ): Promise<GetTissSchemaValidationResult>;

  /** G-05 — listar validações de schema. */
  listTissSchemaValidations(
    input?: ListTissSchemaValidationsInput,
  ): Promise<ListTissSchemaValidationsResult>;

  /** G-05 — validar schema de documento TISS. */
  validateTissSchema(input: ValidateTissSchemaInput): Promise<ValidateTissSchemaResult>;

  /** G-05 — estatísticas de validações de schema. */
  getTissSchemaValidationStats(
    input?: GetTissSchemaValidationStatsInput,
  ): Promise<GetTissSchemaValidationStatsResult>;

  /** G-06 — registrar validação de negócio TISS. */
  registerTissBusinessValidation(
    input: RegisterTissBusinessValidationInput,
  ): Promise<RegisterTissBusinessValidationResult>;

  /** G-06 — recuperar validação de negócio por id. */
  getTissBusinessValidation(
    input: GetTissBusinessValidationInput,
  ): Promise<GetTissBusinessValidationResult>;

  /** G-06 — listar validações de negócio. */
  listTissBusinessValidations(
    input?: ListTissBusinessValidationsInput,
  ): Promise<ListTissBusinessValidationsResult>;

  /** G-06 — validar regra de negócio TISS. */
  validateTissBusiness(input: ValidateTissBusinessInput): Promise<ValidateTissBusinessResult>;

  /** G-06 — estatísticas de validações de negócio. */
  getTissBusinessValidationStats(
    input?: GetTissBusinessValidationStatsInput,
  ): Promise<GetTissBusinessValidationStatsResult>;

  /** G-07 — registrar validação de operadora TISS. */
  registerTissOperatorValidation(
    input: RegisterTissOperatorValidationInput,
  ): Promise<RegisterTissOperatorValidationResult>;

  /** G-07 — atualizar validação de operadora TISS. */
  updateTissOperatorValidation(
    input: UpdateTissOperatorValidationInput,
  ): Promise<UpdateTissOperatorValidationResult>;

  /** G-07 — remover validação de operadora TISS. */
  removeTissOperatorValidation(
    input: RemoveTissOperatorValidationInput,
  ): Promise<RemoveTissOperatorValidationResult>;

  /** G-07 — recuperar validação de operadora por id. */
  getTissOperatorValidation(
    input: GetTissOperatorValidationInput,
  ): Promise<GetTissOperatorValidationResult>;

  /** G-07 — listar validações de operadora. */
  listTissOperatorValidations(
    input?: ListTissOperatorValidationsInput,
  ): Promise<ListTissOperatorValidationsResult>;

  /** G-07 — validar regra de operadora TISS. */
  validateTissOperator(input: ValidateTissOperatorInput): Promise<ValidateTissOperatorResult>;

  /** G-07 — estatísticas de validações de operadora. */
  getTissOperatorValidationStats(
    input?: GetTissOperatorValidationStatsInput,
  ): Promise<GetTissOperatorValidationStatsResult>;

  /** G-08 — registrar reparo TISS. */
  registerTissRepair(input: RegisterTissRepairInput): Promise<RegisterTissRepairResult>;

  /** G-08 — atualizar reparo TISS. */
  updateTissRepair(input: UpdateTissRepairInput): Promise<UpdateTissRepairResult>;

  /** G-08 — remover reparo TISS. */
  removeTissRepair(input: RemoveTissRepairInput): Promise<RemoveTissRepairResult>;

  /** G-08 — recuperar reparo por id. */
  getTissRepair(input: GetTissRepairInput): Promise<GetTissRepairResult>;

  /** G-08 — listar reparos. */
  listTissRepairs(input?: ListTissRepairsInput): Promise<ListTissRepairsResult>;

  /** G-08 — executar reparo em documento TISS. */
  repairTiss(input: RepairTissInput): Promise<RepairTissResult>;

  /** G-08 — estatísticas de reparos. */
  getTissRepairStats(input?: GetTissRepairStatsInput): Promise<GetTissRepairStatsResult>;

  /** G-09 — registrar correção TISS. */
  registerTissCorrection(input: RegisterTissCorrectionInput): Promise<RegisterTissCorrectionResult>;

  /** G-09 — atualizar correção TISS. */
  updateTissCorrection(input: UpdateTissCorrectionInput): Promise<UpdateTissCorrectionResult>;

  /** G-09 — remover correção TISS. */
  removeTissCorrection(input: RemoveTissCorrectionInput): Promise<RemoveTissCorrectionResult>;

  /** G-09 — recuperar correção por id. */
  getTissCorrection(input: GetTissCorrectionInput): Promise<GetTissCorrectionResult>;

  /** G-09 — listar correções. */
  listTissCorrections(input?: ListTissCorrectionsInput): Promise<ListTissCorrectionsResult>;

  /** G-09 — executar correção em documento TISS. */
  correctTiss(input: CorrectTissInput): Promise<CorrectTissResult>;

  /** G-09 — estatísticas de correções. */
  getTissCorrectionStats(
    input?: GetTissCorrectionStatsInput,
  ): Promise<GetTissCorrectionStatsResult>;
}
