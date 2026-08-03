/**
 * InMemoryXMLSchemaRuntimeStore — store in-process (TISS-07).
 *
 * Implementação oficial do XML Schema Runtime Store.
 * Sem banco. Sem XSD oficial. Sem validação. Sem XML TISS/ANS. Sem operadoras.
 */
import type { CanonicalXMLSchemaStatistics } from "../ports/canonical";
import type {
  StoredCanonicalXMLSchemaResult,
  XMLSchemaRuntimeStore,
} from "./xml-schema-runtime-store";

export const IN_MEMORY_XML_SCHEMA_RUNTIME_STORE_ID = "in-memory-xml-schema-runtime";

export type InMemoryXMLSchemaRuntimeStoreOptions = {
  results?: readonly StoredCanonicalXMLSchemaResult[];
};

/**
 * Store de resultados XML Schema canônicos in-memory — exclusivo do Adapter (TISS-07).
 */
export class InMemoryXMLSchemaRuntimeStore implements XMLSchemaRuntimeStore {
  readonly storeId = IN_MEMORY_XML_SCHEMA_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalXMLSchemaResult>();

  constructor(options: InMemoryXMLSchemaRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalXMLSchemaResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalXMLSchemaResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalXMLSchemaResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalXMLSchemaStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let registered = 0;
    for (const result of all) {
      if (result.status === "completed" || result.status === "registered") completed += 1;
      if (result.status === "registered") registered += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-xml-schema-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      registeredSchemas: registered,
      officialXsdLoadedCount: 0,
      xsdValidationPerformedCount: 0,
      realTissXmlValidatedCount: 0,
      realAnsXmlValidatedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Schema Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
