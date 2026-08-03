/**
 * InMemoryNamespaceRuntimeStore — store in-process (TISS-10).
 *
 * Implementação oficial do Namespace Runtime Store.
 * Sem banco. Sem namespace oficial. Sem resolução real. Sem XML TISS/ANS. Sem operadoras.
 * Sem carregar arquivos. Sem parser. Sem namespaces oficiais.
 */
import type { CanonicalNamespaceStatistics } from "../ports/canonical";
import type {
  StoredCanonicalNamespaceRuntimeResult,
  NamespaceRuntimeStore,
} from "./namespace-runtime-store";

export const IN_MEMORY_NAMESPACE_RUNTIME_STORE_ID = "in-memory-namespace-runtime";

export type InMemoryNamespaceRuntimeStoreOptions = {
  results?: readonly StoredCanonicalNamespaceRuntimeResult[];
};

/**
 * Store de resultados Namespace Runtime canônicos in-memory — exclusivo do Adapter (TISS-10).
 */
export class InMemoryNamespaceRuntimeStore implements NamespaceRuntimeStore {
  readonly storeId = IN_MEMORY_NAMESPACE_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredCanonicalNamespaceRuntimeResult>();

  constructor(options: InMemoryNamespaceRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) {
      this.setResult(result);
    }
  }

  getResult(resultId: string): StoredCanonicalNamespaceRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalNamespaceRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredCanonicalNamespaceRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalNamespaceStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let prepared = 0;
    for (const result of all) {
      if (result.status === "completed" || result.status === "prepared") completed += 1;
      if (result.status === "prepared") prepared += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-namespace-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      preparedResults: prepared,
      officialNamespacesLoadedCount: 0,
      realNamespacesLoadedCount: 0,
      namespaceResolutionEnabledCount: 0,
      namespaceValidationEnabledCount: 0,
      officialAnsNamespacesLoadedCount: 0,
      officialTissNamespacesLoadedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Namespace Runtime store ready (${this.resultCount()} results).`,
    };
  }
}
