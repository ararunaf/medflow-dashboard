/**
 * DefaultTissEngineAdapter — G-01.
 *
 * Adapter enterprise oficial do Bloco G.
 * Ativa G-01: TISS Knowledge.
 */
import { TissKnowledgeEngine } from "../tiss-knowledge";
import {
  G01_TISS_ENTERPRISE_CAPABILITIES,
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
} from "../ports";

const DEFAULT_TISS_ENGINE_ADAPTER_ID = "enterprise-tiss-engine";

export class DefaultTissEngineAdapter implements TissEnginePort {
  private readonly knowledge = new TissKnowledgeEngine();

  identity(): TissEngineInfo {
    return {
      id: DEFAULT_TISS_ENGINE_ADAPTER_ID,
      name: "Enterprise TISS Engine",
      version: "G-01",
      vendor: "enterprise",
      provider: "default",
    };
  }

  getCapabilities() {
    return { ...G01_TISS_ENTERPRISE_CAPABILITIES };
  }

  async health(): Promise<TissEngineHealth> {
    const caps = this.getCapabilities();
    return {
      ok: caps.tissKnowledgeImplemented,
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
}
