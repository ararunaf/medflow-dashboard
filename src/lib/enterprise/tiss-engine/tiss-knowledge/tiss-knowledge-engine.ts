/**
 * TissKnowledgeEngine — G-01.
 *
 * Catálogo de conhecimento TISS. Não interpreta XML, não valida,
 * não transforma, não serializa e não acessa banco.
 */
import {
  createCanonicalTissKnowledge,
  type CanonicalTissKnowledge,
  type GetTissKnowledgeStatsResult,
  type ListTissKnowledgeResult,
  type RegisterTissKnowledgeResult,
  type SearchTissKnowledgeResult,
} from "../ports";

export class TissKnowledgeEngine {
  private readonly store = new Map<string, CanonicalTissKnowledge>();

  register(input: { knowledge: CanonicalTissKnowledge }): RegisterTissKnowledgeResult {
    const { knowledge } = input;

    if (!knowledge.knowledgeId || knowledge.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_KNOWLEDGE_MISSING_ID",
        message: "knowledgeId is required",
      };
    }

    if (!knowledge.name || knowledge.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_KNOWLEDGE_MISSING_NAME",
        message: "name is required",
      };
    }

    const canonical = createCanonicalTissKnowledge(knowledge);
    this.store.set(canonical.knowledgeId, canonical);

    return {
      ok: true,
      code: "TISS_KNOWLEDGE_REGISTERED",
      message: "knowledge registered",
      knowledgeId: canonical.knowledgeId,
      knowledge: canonical,
    };
  }

  get(knowledgeId: string): CanonicalTissKnowledge | null {
    return this.store.get(knowledgeId) ?? null;
  }

  list(tag?: string): CanonicalTissKnowledge[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((k) => k.tags?.includes(tag));
  }

  search(query: string): CanonicalTissKnowledge[] {
    const lower = query.toLowerCase();
    return Array.from(this.store.values()).filter(
      (k) =>
        k.name.toLowerCase().includes(lower) ||
        (k.description ?? "").toLowerCase().includes(lower) ||
        k.knowledgeId.toLowerCase().includes(lower),
    );
  }

  stats(tag?: string): GetTissKnowledgeStatsResult["stats"] {
    const all = this.list(tag);
    const byTag: Record<string, number> = {};

    for (const k of this.store.values()) {
      for (const t of k.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      knowledgeIds: all.map((k) => k.knowledgeId),
    };
  }

  listResult(tag?: string): ListTissKnowledgeResult {
    return {
      ok: true,
      code: "TISS_KNOWLEDGE_LIST_OK",
      message: "knowledge listed",
      knowledges: this.list(tag),
    };
  }

  searchResult(query: string): SearchTissKnowledgeResult {
    return {
      ok: true,
      code: "TISS_KNOWLEDGE_SEARCH_OK",
      message: "knowledge searched",
      knowledges: this.search(query),
    };
  }

  statsResult(tag?: string): GetTissKnowledgeStatsResult {
    return {
      ok: true,
      code: "TISS_KNOWLEDGE_STATS_OK",
      message: "stats computed",
      stats: this.stats(tag),
    };
  }
}
