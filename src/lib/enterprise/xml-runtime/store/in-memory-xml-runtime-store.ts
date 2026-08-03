/**
 * InMemoryXMLRuntimeStore — store in-process (TISS-04).
 *
 * Implementação oficial do XML Runtime Store.
 * Sem banco. Sem XML real. Sem operadoras. Sem contratos. Sem tenants.
 */
import type { CanonicalXMLStatistics } from "../ports/canonical";
import type { StoredXMLGeneration, XMLRuntimeStore } from "./xml-runtime-store";

export const IN_MEMORY_XML_RUNTIME_STORE_ID = "in-memory-xml-runtime";

export type InMemoryXMLRuntimeStoreOptions = {
  generations?: readonly StoredXMLGeneration[];
};

/**
 * Store de gerações XML canônicas in-memory — exclusivo do Adapter (TISS-04).
 */
export class InMemoryXMLRuntimeStore implements XMLRuntimeStore {
  readonly storeId = IN_MEMORY_XML_RUNTIME_STORE_ID;

  private readonly generations = new Map<string, StoredXMLGeneration>();

  constructor(options: InMemoryXMLRuntimeStoreOptions = {}) {
    for (const generation of options.generations ?? []) {
      this.setGeneration(generation);
    }
  }

  getGeneration(generationId: string): StoredXMLGeneration | undefined {
    const generation = this.generations.get(generationId);
    return generation ? { ...generation } : undefined;
  }

  setGeneration(generation: StoredXMLGeneration): void {
    this.generations.set(generation.generationId, { ...generation });
  }

  listGenerations(): readonly StoredXMLGeneration[] {
    return Array.from(this.generations.values()).map((generation) => ({ ...generation }));
  }

  generationCount(): number {
    return this.generations.size;
  }

  statistics(): CanonicalXMLStatistics {
    const all = this.listGenerations();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let validated = 0;
    let catalogConsumptions = 0;
    let rulePackConsumptions = 0;
    for (const generation of all) {
      if (generation.status === "completed") completed += 1;
      if (generation.status === "failed") failed += 1;
      if (generation.status === "cancelled") cancelled += 1;
      if (generation.status === "validated") validated += 1;
      if (generation.catalogConsumed) catalogConsumptions += 1;
      if (generation.rulePackConsumed) rulePackConsumptions += 1;
    }
    return {
      kind: "canonical-xml-statistics",
      totalGenerations: all.length,
      completedGenerations: completed,
      failedGenerations: failed,
      cancelledGenerations: cancelled,
      validatedGenerations: validated,
      catalogConsumptions,
      rulePackConsumptions,
      realXmlGeneratedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Runtime store ready (${this.generationCount()} generations).`,
    };
  }
}
