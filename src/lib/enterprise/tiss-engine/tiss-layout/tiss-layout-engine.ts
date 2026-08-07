/**
 * TissLayoutEngine — G-02.
 *
 * Catálogo de layouts TISS. Não interpreta, serializa, valida XML,
 * acessa banco ou conhece domínio específico.
 * Reutiliza TissKnowledgeEngine para validar `knowledgeId`.
 */
import type {
  CanonicalTissLayout,
  GetTissLayoutStatsResult,
  ListTissLayoutResult,
  RegisterTissLayoutResult,
  SearchTissLayoutResult,
} from "../ports";
import { TissKnowledgeEngine } from "../tiss-knowledge";

export class TissLayoutEngine {
  private readonly store = new Map<string, CanonicalTissLayout>();

  constructor(private readonly knowledge: TissKnowledgeEngine) {}

  private canonicalize(layout: CanonicalTissLayout): CanonicalTissLayout {
    return {
      kind: "tiss-layout",
      layoutId: layout.layoutId,
      name: layout.name,
      knowledgeId: layout.knowledgeId,
      description: layout.description ?? "",
      version: layout.version ?? "",
      tags: layout.tags ?? [],
    };
  }

  register(layout: CanonicalTissLayout): RegisterTissLayoutResult {
    if (!layout.layoutId || layout.layoutId.trim() === "") {
      return {
        ok: false,
        code: "TISS_LAYOUT_MISSING_ID",
        message: "layoutId is required",
      };
    }

    if (!layout.name || layout.name.trim() === "") {
      return {
        ok: false,
        code: "TISS_LAYOUT_MISSING_NAME",
        message: "name is required",
      };
    }

    if (!layout.knowledgeId || layout.knowledgeId.trim() === "") {
      return {
        ok: false,
        code: "TISS_LAYOUT_MISSING_KNOWLEDGE_ID",
        message: "knowledgeId is required",
      };
    }

    const known = this.knowledge.get(layout.knowledgeId);
    if (!known) {
      return {
        ok: false,
        code: "TISS_LAYOUT_UNKNOWN_KNOWLEDGE",
        message: "knowledgeId not registered in TissKnowledgeEngine",
      };
    }

    const canonical = this.canonicalize(layout);
    this.store.set(canonical.layoutId, canonical);

    return {
      ok: true,
      code: "TISS_LAYOUT_REGISTERED",
      message: "layout registered",
      layoutId: canonical.layoutId,
      layout: canonical,
    };
  }

  get(layoutId: string): CanonicalTissLayout | null {
    return this.store.get(layoutId) ?? null;
  }

  list(tag?: string): CanonicalTissLayout[] {
    const all = Array.from(this.store.values());
    if (!tag) return all;
    return all.filter((l) => l.tags?.includes(tag));
  }

  search(query: string): CanonicalTissLayout[] {
    const lower = query.toLowerCase();
    return Array.from(this.store.values()).filter(
      (l) =>
        l.name.toLowerCase().includes(lower) ||
        (l.description ?? "").toLowerCase().includes(lower) ||
        l.layoutId.toLowerCase().includes(lower),
    );
  }

  stats(tag?: string): GetTissLayoutStatsResult["stats"] {
    const all = this.list(tag);
    const byTag: Record<string, number> = {};

    for (const l of this.store.values()) {
      for (const t of l.tags ?? []) {
        byTag[t] = (byTag[t] ?? 0) + 1;
      }
    }

    return {
      total: all.length,
      byTag,
      layoutIds: all.map((l) => l.layoutId),
    };
  }

  listResult(tag?: string): ListTissLayoutResult {
    return {
      ok: true,
      code: "TISS_LAYOUT_LIST_OK",
      message: "layouts listed",
      layouts: this.list(tag),
    };
  }

  searchResult(query: string): SearchTissLayoutResult {
    return {
      ok: true,
      code: "TISS_LAYOUT_SEARCH_OK",
      message: "layouts searched",
      layouts: this.search(query),
    };
  }

  statsResult(tag?: string): GetTissLayoutStatsResult {
    return {
      ok: true,
      code: "TISS_LAYOUT_STATS_OK",
      message: "layout stats computed",
      stats: this.stats(tag),
    };
  }
}
