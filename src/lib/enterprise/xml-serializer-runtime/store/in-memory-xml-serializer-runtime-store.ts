/**
 * InMemoryXMLSerializerRuntimeStore — store in-process (TISS-06).
 *
 * Implementação oficial do XML Serializer Runtime Store.
 * Sem banco. Sem XML TISS/ANS real. Sem operadoras. Sem contratos. Sem tenants.
 */
import type { CanonicalXMLSerializerStatistics } from "../ports/canonical";
import type {
  StoredCanonicalXMLSerializeResult,
  XMLSerializerRuntimeStore,
} from "./xml-serializer-runtime-store";

export const IN_MEMORY_XML_SERIALIZER_RUNTIME_STORE_ID = "in-memory-xml-serializer-runtime";

export type InMemoryXMLSerializerRuntimeStoreOptions = {
  results?: readonly StoredCanonicalXMLSerializeResult[];
};

/**
 * Store de resultados XML canônicos serializados in-memory — exclusivo do Adapter (TISS-06).
 */
export class InMemoryXMLSerializerRuntimeStore implements XMLSerializerRuntimeStore {
  readonly storeId = IN_MEMORY_XML_SERIALIZER_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalXMLSerializeResult>();

  constructor(options: InMemoryXMLSerializerRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalXMLSerializeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalXMLSerializeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalXMLSerializeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalXMLSerializerStatistics {
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
      kind: "canonical-xml-serializer-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      realTissXmlGeneratedCount: 0,
      realAnsXmlGeneratedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Serializer Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
