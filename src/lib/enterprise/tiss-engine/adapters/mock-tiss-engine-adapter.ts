/**
 * MockTissEngineAdapter — G-03.
 *
 * Adapter mock para testes do Bloco G.
 */
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import { TissParserEngine } from "../tiss-parser";
import {
  G03_TISS_ENTERPRISE_CAPABILITIES,
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
} from "../ports";

const MOCK_TISS_ENGINE_ADAPTER_ID = "enterprise-tiss-engine-mock";

export class MockTissEngineAdapter implements TissEnginePort {
  private readonly knowledge = new TissKnowledgeEngine();
  private readonly layout = new TissLayoutEngine(this.knowledge);
  private readonly parser = new TissParserEngine(this.knowledge, this.layout);

  identity(): TissEngineInfo {
    return {
      id: MOCK_TISS_ENGINE_ADAPTER_ID,
      name: "Enterprise TISS Engine Mock",
      version: "G-03",
      vendor: "enterprise",
      provider: "mock",
    };
  }

  getCapabilities() {
    return { ...G03_TISS_ENTERPRISE_CAPABILITIES };
  }

  async health(): Promise<TissEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok: caps.tissKnowledgeImplemented && caps.tissLayoutImplemented && caps.tissParserImplemented,
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
    return {
      ok: true,
      code: "MOCK_TISS_KNOWLEDGE_FOUND",
      message: "knowledge found",
      knowledge,
    };
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
    return {
      ok: true,
      code: "MOCK_TISS_LAYOUT_FOUND",
      message: "layout found",
      layout,
    };
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
    return {
      ok: true,
      code: "MOCK_TISS_PARSER_FOUND",
      message: "parser found",
      parser,
    };
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
}
