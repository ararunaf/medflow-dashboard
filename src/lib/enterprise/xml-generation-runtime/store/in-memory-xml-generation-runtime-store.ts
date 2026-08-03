/**
 * InMemoryXMLGenerationRuntimeStore — store in-process (TISS-05).
 *
 * Implementação oficial do XML Generation Runtime Store.
 * Sem banco. Sem XML real. Sem operadoras. Sem contratos. Sem tenants.
 */
import type { CanonicalXMLGenerationStatistics } from "../ports/canonical";
import type {
  StoredCanonicalXMLResult,
  XMLGenerationRuntimeStore,
} from "./xml-generation-runtime-store";

export const IN_MEMORY_XML_GENERATION_RUNTIME_STORE_ID = "in-memory-xml-generation-runtime";

export type InMemoryXMLGenerationRuntimeStoreOptions = {
  results?: readonly StoredCanonicalXMLResult[];
};

/**
 * Store de resultados XML canônicos in-memory — exclusivo do Adapter (TISS-05).
 */
export class InMemoryXMLGenerationRuntimeStore implements XMLGenerationRuntimeStore {
  readonly storeId = IN_MEMORY_XML_GENERATION_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalXMLResult>();

  constructor(options: InMemoryXMLGenerationRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalXMLResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalXMLResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalXMLResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalXMLGenerationStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    for (const result of all) {
      if (result.status === "completed") completed += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-xml-generation-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      realXmlGeneratedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Generation Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
