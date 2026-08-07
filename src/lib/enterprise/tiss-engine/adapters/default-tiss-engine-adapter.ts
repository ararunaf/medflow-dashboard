/**
 * DefaultTissEngineAdapter — G-02.
 *
 * Adapter enterprise oficial do Bloco G.
 * Ativa G-01 (TISS Knowledge) e G-02 (TISS Layout).
 */
import { TissKnowledgeEngine } from "../tiss-knowledge";
import { TissLayoutEngine } from "../tiss-layout";
import {
  G02_TISS_ENTERPRISE_CAPABILITIES,
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
  type CanonicalTissKnowledge,
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
} from "../ports";

const DEFAULT_TISS_ENGINE_ADAPTER_ID = "enterprise-tiss-engine";

export class DefaultTissEngineAdapter implements TissEnginePort {
  private readonly knowledge = new TissKnowledgeEngine();
  private readonly layout = new TissLayoutEngine(this.knowledge);

  identity(): TissEngineInfo {
    return {
      id: DEFAULT_TISS_ENGINE_ADAPTER_ID,
      name: "Enterprise TISS Engine",
      version: "G-02",
      vendor: "enterprise",
      provider: "default",
    };
  }

  getCapabilities() {
    return { ...G02_TISS_ENTERPRISE_CAPABILITIES };
  }

  async health(): Promise<TissEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok: caps.tissKnowledgeImplemented && caps.tissLayoutImplemented,
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
    return {
      ok: true,
      code: "TISS_KNOWLEDGE_FOUND",
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
        code: "TISS_LAYOUT_NOT_FOUND",
        message: "layout not found",
        layout: null,
      };
    }
    return {
      ok: true,
      code: "TISS_LAYOUT_FOUND",
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
}
