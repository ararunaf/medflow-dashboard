/**
 * MockTissEngineAdapter — G-05.
 *
 * Adapter mock para testes do Bloco G.
 */
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";
import { TissSchemaValidationEngine } from "../tiss-schema-validation";
import { TissSerializerEngine } from "../tiss-serializer";
import {
  G05_TISS_ENTERPRISE_CAPABILITIES,
  type TissEnginePort,
  type TissEngineInfo,
  type TissEngineHealth,
  type RegisterTissKnowledgeInput,
  type RegisterTissKnowledgeResult,
  type GetTissKnowledgeInput,
  type GetTissKnowledgeResult,
  type ListTissKnowledgeInput,
  type ListTissKnowledgeResult,
  type SearchTissKnowledgeInput,
  type SearchTissKnowledgeResult,
  type GetTissKnowledgeStatsInput,
  type GetTissKnowledgeStatsResult,
  type RegisterTissLayoutInput,
  type RegisterTissLayoutResult,
  type GetTissLayoutInput,
  type GetTissLayoutResult,
  type ListTissLayoutInput,
  type ListTissLayoutResult,
  type SearchTissLayoutInput,
  type SearchTissLayoutResult,
  type GetTissLayoutStatsInput,
  type GetTissLayoutStatsResult,
  type RegisterTissParserInput,
  type RegisterTissParserResult,
  type GetTissParserInput,
  type GetTissParserResult,
  type ListTissParsersInput,
  type ListTissParsersResult,
  type ParseTissInput,
  type ParseTissResult,
  type GetTissParserStatsInput,
  type GetTissParserStatsResult,
  type RegisterTissSerializerInput,
  type RegisterTissSerializerResult,
  type GetTissSerializerInput,
  type GetTissSerializerResult,
  type ListTissSerializersInput,
  type ListTissSerializersResult,
  type SerializeTissInput,
  type SerializeTissResult,
  type GetTissSerializerStatsInput,
  type GetTissSerializerStatsResult,
  type RegisterTissSchemaValidationInput,
  type RegisterTissSchemaValidationResult,
  type GetTissSchemaValidationInput,
  type GetTissSchemaValidationResult,
  type ListTissSchemaValidationsInput,
  type ListTissSchemaValidationsResult,
  type ValidateTissSchemaInput,
  type ValidateTissSchemaResult,
  type GetTissSchemaValidationStatsInput,
  type GetTissSchemaValidationStatsResult,
} from "../ports";

const MOCK_TISS_ENGINE_ADAPTER_ID = "enterprise-tiss-engine-mock";

export class MockTissEngineAdapter implements TissEnginePort {
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

  identity(): TissEngineInfo {
    return {
      id: MOCK_TISS_ENGINE_ADAPTER_ID,
      name: "Enterprise TISS Engine Mock",
      version: "G-05",
      vendor: "enterprise",
      provider: "mock",
    };
  }

  getCapabilities() {
    return { ...G05_TISS_ENTERPRISE_CAPABILITIES };
  }

  async health(): Promise<TissEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok:
        caps.tissKnowledgeImplemented &&
        caps.tissLayoutImplemented &&
        caps.tissParserImplemented &&
        caps.tissSerializerImplemented &&
        caps.tissSchemaValidationImplemented,
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
        code: "MOCK_TISS_KNOWLEDGE_NOT_FOUND",
        message: "knowledge not found",
        knowledge: null,
      };
    }
    return { ok: true, code: "MOCK_TISS_KNOWLEDGE_FOUND", message: "knowledge found", knowledge };
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
        code: "MOCK_TISS_LAYOUT_NOT_FOUND",
        message: "layout not found",
        layout: null,
      };
    }
    return { ok: true, code: "MOCK_TISS_LAYOUT_FOUND", message: "layout found", layout };
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
        code: "MOCK_TISS_PARSER_NOT_FOUND",
        message: "parser not found",
        parser: null,
      };
    }
    return { ok: true, code: "MOCK_TISS_PARSER_FOUND", message: "parser found", parser };
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
        code: "MOCK_TISS_SERIALIZER_NOT_FOUND",
        message: "serializer not found",
        serializer: null,
      };
    }
    return {
      ok: true,
      code: "MOCK_TISS_SERIALIZER_FOUND",
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
        code: "MOCK_TISS_SCHEMA_VALIDATION_NOT_FOUND",
        message: "schema validation not found",
        schemaValidation: null,
      };
    }
    return {
      ok: true,
      code: "MOCK_TISS_SCHEMA_VALIDATION_FOUND",
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
}
