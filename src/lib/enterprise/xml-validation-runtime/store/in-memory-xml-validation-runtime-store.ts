/**
 * InMemoryXMLValidationRuntimeStore — store in-process (TISS-08).
 *
 * Implementação oficial do XML Validation Runtime Store.
 * Sem banco. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS. Sem operadoras.
 */
import type { CanonicalXMLValidationStatistics } from "../ports/canonical";
import type {
  StoredCanonicalXMLValidationResult,
  XMLValidationRuntimeStore,
} from "./xml-validation-runtime-store";

export const IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID = "in-memory-xml-validation-runtime";

export type InMemoryXMLValidationRuntimeStoreOptions = {
  results?: readonly StoredCanonicalXMLValidationResult[];
};

/**
 * Store de resultados XML Validation canônicos in-memory — exclusivo do Adapter (TISS-08).
 */
export class InMemoryXMLValidationRuntimeStore implements XMLValidationRuntimeStore {
  readonly storeId = IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalXMLValidationResult>();

  constructor(options: InMemoryXMLValidationRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalXMLValidationResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalXMLValidationResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalXMLValidationResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalXMLValidationStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let validated = 0;
    for (const result of all) {
      if (result.status === "completed" || result.status === "validated") completed += 1;
      if (result.status === "validated") validated += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-xml-validation-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      validatedResults: validated,
      validationExecutedCount: 0,
      realValidationPerformedCount: 0,
      officialXsdLoadedCount: 0,
      officialAnsValidationCount: 0,
      officialTissValidationCount: 0,
      validationRulesLoadedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Validation Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
