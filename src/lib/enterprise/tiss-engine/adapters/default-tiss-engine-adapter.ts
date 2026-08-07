/**
 * DefaultTissEngineAdapter — G-07.
 *
 * Adapter enterprise oficial do Bloco G.
 * Ativa G-01 a G-07.
 */
import { TissBusinessValidationEngine } from "../tiss-business-validation";
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissOperatorValidationEngine } from "../tiss-operator-validation";
import { TissParserEngine } from "../tiss-parser";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";
import { G07_TISS_ENTERPRISE_CAPABILITIES } from "../ports";
import type {
  TissEnginePort,
  TissEngineInfo,
  TissEngineHealth,
  RegisterTissKnowledgeInput,
  RegisterTissKnowledgeResult,
  GetTissKnowledgeInput,
  GetTissKnowledgeResult,
  ListTissKnowledgeInput,
  ListTissKnowledgeResult,
  SearchTissKnowledgeInput,
  SearchTissKnowledgeResult,
  GetTissKnowledgeStatsInput,
  GetTissKnowledgeStatsResult,
  RegisterTissLayoutInput,
  RegisterTissLayoutResult,
  GetTissLayoutInput,
  GetTissLayoutResult,
  ListTissLayoutInput,
  ListTissLayoutResult,
  SearchTissLayoutInput,
  SearchTissLayoutResult,
  GetTissLayoutStatsInput,
  GetTissLayoutStatsResult,
  RegisterTissParserInput,
  RegisterTissParserResult,
  GetTissParserInput,
  GetTissParserResult,
  ListTissParsersInput,
  ListTissParsersResult,
  ParseTissInput,
  ParseTissResult,
  GetTissParserStatsInput,
  GetTissParserStatsResult,
  RegisterTissSerializerInput,
  RegisterTissSerializerResult,
  GetTissSerializerInput,
  GetTissSerializerResult,
  ListTissSerializersInput,
  ListTissSerializersResult,
  SerializeTissInput,
  SerializeTissResult,
  GetTissSerializerStatsInput,
  GetTissSerializerStatsResult,
  RegisterTissSchemaValidationInput,
  RegisterTissSchemaValidationResult,
  GetTissSchemaValidationInput,
  GetTissSchemaValidationResult,
  ListTissSchemaValidationsInput,
  ListTissSchemaValidationsResult,
  ValidateTissSchemaInput,
  ValidateTissSchemaResult,
  GetTissSchemaValidationStatsInput,
  GetTissSchemaValidationStatsResult,
  RegisterTissBusinessValidationInput,
  RegisterTissBusinessValidationResult,
  GetTissBusinessValidationInput,
  GetTissBusinessValidationResult,
  ListTissBusinessValidationsInput,
  ListTissBusinessValidationsResult,
  ValidateTissBusinessInput,
  ValidateTissBusinessResult,
  GetTissBusinessValidationStatsInput,
  GetTissBusinessValidationStatsResult,
  RegisterTissOperatorValidationInput,
  RegisterTissOperatorValidationResult,
  GetTissOperatorValidationInput,
  GetTissOperatorValidationResult,
  ListTissOperatorValidationsInput,
  ListTissOperatorValidationsResult,
  ValidateTissOperatorInput,
  ValidateTissOperatorResult,
  GetTissOperatorValidationStatsInput,
  GetTissOperatorValidationStatsResult,
  UpdateTissOperatorValidationInput,
  UpdateTissOperatorValidationResult,
  RemoveTissOperatorValidationInput,
  RemoveTissOperatorValidationResult,
} from "../ports";

const DEFAULT_TISS_ENGINE_ADAPTER_ID = "enterprise-tiss-engine";

export class DefaultTissEngineAdapter implements TissEnginePort {
  private readonly knowledge = new TissKnowledgeEngine();
  private readonly layout = new TissLayoutEngine(this.knowledge);
  private readonly parser = new TissParserEngine(this.knowledge, this.layout);
  private readonly serializer = new TissSerializerEngine(this.knowledge, this.layout, this.parser);
  private readonly schemaValidation = new TissSchemaValidationEngine(
    this.knowledge,
    this.layout,
    this.parser,
    this.serializer,
  );
  private readonly businessValidation = new TissBusinessValidationEngine(
    this.knowledge,
    this.layout,
    this.parser,
    this.serializer,
    this.schemaValidation,
  );
  private readonly operatorValidation = new TissOperatorValidationEngine(
    this.knowledge,
    this.layout,
    this.parser,
    this.serializer,
    this.schemaValidation,
    this.businessValidation,
  );

  identity(): TissEngineInfo {
    return {
      id: DEFAULT_TISS_ENGINE_ADAPTER_ID,
      name: "Enterprise TISS Engine",
      version: "G-07",
      vendor: "enterprise",
      provider: "default",
    };
  }

  getCapabilities() {
    return { ...G07_TISS_ENTERPRISE_CAPABILITIES };
  }

  async health(): Promise<TissEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok:
        caps.tissKnowledgeImplemented &&
        caps.tissLayoutImplemented &&
        caps.tissParserImplemented &&
        caps.tissSerializerImplemented &&
        caps.tissSchemaValidationImplemented &&
        caps.tissBusinessValidationImplemented &&
        caps.tissOperatorValidationImplemented,
      tissEngineOk: caps.tissEngineImplemented,
      tissKnowledgeOk: caps.tissKnowledgeImplemented,
      tissLayoutOk: caps.tissLayoutImplemented,
      tissParserOk: caps.tissParserImplemented,
      tissSerializerOk: caps.tissSerializerImplemented,
      tissSchemaValidationOk: caps.tissSchemaValidationImplemented,
      tissBusinessValidationOk: caps.tissBusinessValidationImplemented,
      tissOperatorValidationOk: caps.tissOperatorValidationImplemented,
      tissRepairOk: caps.tissRepairImplemented,
      tissCorrectionOk: caps.tissCorrectionImplemented,
    };
  }

  async registerTissKnowledge(
    input: RegisterTissKnowledgeInput,
  ): Promise<RegisterTissKnowledgeResult> {
    return this.knowledge.register(input);
  }

  async getTissKnowledge(input: GetTissKnowledgeInput): Promise<GetTissKnowledgeResult> {
    const knowledge = this.knowledge.get(input.knowledgeId);
    if (!knowledge) {
      return {
        ok: false,
        code: "TISS_KNOWLEDGE_NOT_FOUND",
        message: "knowledge not found",
        knowledge: null,
      };
    }
    return { ok: true, code: "TISS_KNOWLEDGE_FOUND", message: "knowledge found", knowledge };
  }

  async listTissKnowledge(input: ListTissKnowledgeInput = {}): Promise<ListTissKnowledgeResult> {
    return this.knowledge.listResult(input.tag);
  }

  async searchTissKnowledge(input: SearchTissKnowledgeInput): Promise<SearchTissKnowledgeResult> {
    return this.knowledge.searchResult(input.query);
  }

  async getTissKnowledgeStats(
    input: GetTissKnowledgeStatsInput = {},
  ): Promise<GetTissKnowledgeStatsResult> {
    return this.knowledge.statsResult(input.tag);
  }

  async registerTissLayout(input: RegisterTissLayoutInput): Promise<RegisterTissLayoutResult> {
    return this.layout.register(input.layout);
  }

  async getTissLayout(input: GetTissLayoutInput): Promise<GetTissLayoutResult> {
    const layout = this.layout.get(input.layoutId);
    if (!layout) {
      return {
        ok: false,
        code: "TISS_LAYOUT_NOT_FOUND",
        message: "layout not found",
        layout: null,
      };
    }
    return { ok: true, code: "TISS_LAYOUT_FOUND", message: "layout found", layout };
  }

  async listTissLayout(input: ListTissLayoutInput = {}): Promise<ListTissLayoutResult> {
    return this.layout.listResult(input.tag);
  }

  async searchTissLayout(input: SearchTissLayoutInput): Promise<SearchTissLayoutResult> {
    return this.layout.searchResult(input.query);
  }

  async getTissLayoutStats(input: GetTissLayoutStatsInput = {}): Promise<GetTissLayoutStatsResult> {
    return this.layout.statsResult(input.tag);
  }

  async registerTissParser(input: RegisterTissParserInput): Promise<RegisterTissParserResult> {
    return this.parser.register(input);
  }

  async getTissParser(input: GetTissParserInput): Promise<GetTissParserResult> {
    const parser = this.parser.get(input.parserId);
    if (!parser) {
      return {
        ok: false,
        code: "TISS_PARSER_NOT_FOUND",
        message: "parser not found",
        parser: null,
      };
    }
    return { ok: true, code: "TISS_PARSER_FOUND", message: "parser found", parser };
  }

  async listTissParsers(input: ListTissParsersInput = {}): Promise<ListTissParsersResult> {
    return this.parser.listResult(input.tag);
  }

  async parseTiss(input: ParseTissInput): Promise<ParseTissResult> {
    return this.parser.parse(input);
  }

  async getTissParserStats(input: GetTissParserStatsInput = {}): Promise<GetTissParserStatsResult> {
    return this.parser.statsResult();
  }

  async registerTissSerializer(
    input: RegisterTissSerializerInput,
  ): Promise<RegisterTissSerializerResult> {
    return this.serializer.register(input);
  }

  async getTissSerializer(input: GetTissSerializerInput): Promise<GetTissSerializerResult> {
    const serializer = this.serializer.get(input.serializerId);
    if (!serializer) {
      return {
        ok: false,
        code: "TISS_SERIALIZER_NOT_FOUND",
        message: "serializer not found",
        serializer: null,
      };
    }
    return {
      ok: true,
      code: "TISS_SERIALIZER_FOUND",
      message: "serializer found",
      serializer,
    };
  }

  async listTissSerializers(
    input: ListTissSerializersInput = {},
  ): Promise<ListTissSerializersResult> {
    return this.serializer.listResult(input.tag);
  }

  async serializeTiss(input: SerializeTissInput): Promise<SerializeTissResult> {
    return this.serializer.serialize(input);
  }

  async getTissSerializerStats(
    input: GetTissSerializerStatsInput = {},
  ): Promise<GetTissSerializerStatsResult> {
    return this.serializer.statsResult();
  }

  async registerTissSchemaValidation(
    input: RegisterTissSchemaValidationInput,
  ): Promise<RegisterTissSchemaValidationResult> {
    return this.schemaValidation.register(input);
  }

  async getTissSchemaValidation(
    input: GetTissSchemaValidationInput,
  ): Promise<GetTissSchemaValidationResult> {
    const schemaValidation = this.schemaValidation.get(input.schemaValidationId);
    if (!schemaValidation) {
      return {
        ok: false,
        code: "TISS_SCHEMA_VALIDATION_NOT_FOUND",
        message: "schema validation not found",
        schemaValidation: null,
      };
    }
    return {
      ok: true,
      code: "TISS_SCHEMA_VALIDATION_FOUND",
      message: "schema validation found",
      schemaValidation,
    };
  }

  async listTissSchemaValidations(
    input: ListTissSchemaValidationsInput = {},
  ): Promise<ListTissSchemaValidationsResult> {
    return this.schemaValidation.listResult(input.tag);
  }

  async validateTissSchema(input: ValidateTissSchemaInput): Promise<ValidateTissSchemaResult> {
    return this.schemaValidation.validate(input);
  }

  async getTissSchemaValidationStats(
    input: GetTissSchemaValidationStatsInput = {},
  ): Promise<GetTissSchemaValidationStatsResult> {
    return this.schemaValidation.statsResult();
  }

  async registerTissBusinessValidation(
    input: RegisterTissBusinessValidationInput,
  ): Promise<RegisterTissBusinessValidationResult> {
    return this.businessValidation.register(input);
  }

  async getTissBusinessValidation(
    input: GetTissBusinessValidationInput,
  ): Promise<GetTissBusinessValidationResult> {
    const businessValidation = this.businessValidation.get(input.businessValidationId);
    if (!businessValidation) {
      return {
        ok: false,
        code: "TISS_BUSINESS_VALIDATION_NOT_FOUND",
        message: "business validation not found",
        businessValidation: null,
      };
    }
    return {
      ok: true,
      code: "TISS_BUSINESS_VALIDATION_FOUND",
      message: "business validation found",
      businessValidation,
    };
  }

  async listTissBusinessValidations(
    input: ListTissBusinessValidationsInput = {},
  ): Promise<ListTissBusinessValidationsResult> {
    return this.businessValidation.listResult(input.tag);
  }

  async validateTissBusiness(
    input: ValidateTissBusinessInput,
  ): Promise<ValidateTissBusinessResult> {
    return this.businessValidation.validate(input);
  }

  async getTissBusinessValidationStats(
    input: GetTissBusinessValidationStatsInput = {},
  ): Promise<GetTissBusinessValidationStatsResult> {
    return this.businessValidation.statsResult();
  }

  async registerTissOperatorValidation(
    input: RegisterTissOperatorValidationInput,
  ): Promise<RegisterTissOperatorValidationResult> {
    return this.operatorValidation.register(input);
  }

  async getTissOperatorValidation(
    input: GetTissOperatorValidationInput,
  ): Promise<GetTissOperatorValidationResult> {
    const operatorValidation = this.operatorValidation.get(input.operatorValidationId);
    if (!operatorValidation) {
      return {
        ok: false,
        code: "TISS_OPERATOR_VALIDATION_NOT_FOUND",
        message: "operator validation not found",
        operatorValidation: null,
      };
    }
    return {
      ok: true,
      code: "TISS_OPERATOR_VALIDATION_FOUND",
      message: "operator validation found",
      operatorValidation,
    };
  }

  async listTissOperatorValidations(
    input: ListTissOperatorValidationsInput = {},
  ): Promise<ListTissOperatorValidationsResult> {
    return this.operatorValidation.listResult(input.tag);
  }

  async validateTissOperator(
    input: ValidateTissOperatorInput,
  ): Promise<ValidateTissOperatorResult> {
    return this.operatorValidation.validate(input);
  }

  async updateTissOperatorValidation(
    input: UpdateTissOperatorValidationInput,
  ): Promise<UpdateTissOperatorValidationResult> {
    return this.operatorValidation.update(input);
  }

  async removeTissOperatorValidation(
    input: RemoveTissOperatorValidationInput,
  ): Promise<RemoveTissOperatorValidationResult> {
    return this.operatorValidation.remove(input);
  }

  async getTissOperatorValidationStats(
    input: GetTissOperatorValidationStatsInput = {},
  ): Promise<GetTissOperatorValidationStatsResult> {
    return this.operatorValidation.statsResult();
  }
}
