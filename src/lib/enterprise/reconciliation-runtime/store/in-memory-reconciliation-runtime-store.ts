/**
 * InMemoryReconciliationRuntimeStore — store in-process oficial (C-09).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem reconciliação funcional, sem matching automático, sem resolução de conflitos).
 */
import type { ReconciliationStatistics } from "../ports/canonical";
import type {
  ReconciliationRuntimeStore,
  StoredCanonicalReconciliationResult,
  StoredReconciliationContext,
  StoredReconciliationCorrelation,
  StoredReconciliationManifest,
} from "./reconciliation-runtime-store";

export const IN_MEMORY_RECONCILIATION_RUNTIME_STORE_ID = "in-memory-reconciliation-runtime";

export type InMemoryReconciliationRuntimeStoreOptions = {
  manifests?: readonly StoredReconciliationManifest[];
  contexts?: readonly StoredReconciliationContext[];
  correlations?: readonly StoredReconciliationCorrelation[];
  results?: readonly StoredCanonicalReconciliationResult[];
};

export class InMemoryReconciliationRuntimeStore implements ReconciliationRuntimeStore {
  readonly storeId = IN_MEMORY_RECONCILIATION_RUNTIME_STORE_ID;

  private readonly manifests = new Map<string, StoredReconciliationManifest>();
  private readonly contexts = new Map<string, StoredReconciliationContext>();
  private readonly correlations = new Map<string, StoredReconciliationCorrelation>();
  private readonly results = new Map<string, StoredCanonicalReconciliationResult>();

  constructor(options: InMemoryReconciliationRuntimeStoreOptions = {}) {
    for (const manifest of options.manifests ?? []) this.setManifest(manifest);
    for (const context of options.contexts ?? []) this.setContext(context);
    for (const correlation of options.correlations ?? []) this.setCorrelation(correlation);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getManifest(reconciliationId: string): StoredReconciliationManifest | undefined {
    const manifest = this.manifests.get(reconciliationId);
    return manifest ? { ...manifest } : undefined;
  }

  setManifest(manifest: StoredReconciliationManifest): void {
    const key = manifest.reconciliationId ?? `reconciliation-${this.manifests.size + 1}`;
    this.manifests.set(key, { ...manifest, reconciliationId: key });
  }

  listManifests(): readonly StoredReconciliationManifest[] {
    return Array.from(this.manifests.values()).map((manifest) => ({ ...manifest }));
  }

  manifestCount(): number {
    return this.manifests.size;
  }

  getContext(contextId: string): StoredReconciliationContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredReconciliationContext): void {
    const key = context.contextId ?? context.reconciliationId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredReconciliationContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getCorrelation(correlationId: string): StoredReconciliationCorrelation | undefined {
    const correlation = this.correlations.get(correlationId);
    return correlation ? { ...correlation } : undefined;
  }

  setCorrelation(correlation: StoredReconciliationCorrelation): void {
    const key = correlation.correlationId ?? `correlation-${this.correlations.size + 1}`;
    this.correlations.set(key, { ...correlation, correlationId: key });
  }

  listCorrelations(): readonly StoredReconciliationCorrelation[] {
    return Array.from(this.correlations.values()).map((correlation) => ({ ...correlation }));
  }

  correlationCount(): number {
    return this.correlations.size;
  }

  getResult(resultId: string): StoredCanonicalReconciliationResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredCanonicalReconciliationResult): void {
    const key = result.resultId ?? result.transactionId ?? `result-${this.results.size + 1}`;
    this.results.set(key, { ...result, resultId: key });
  }

  listResults(): readonly StoredCanonicalReconciliationResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): ReconciliationStatistics {
    const all = this.listManifests();
    let pending = 0;
    let correlated = 0;
    let reconciling = 0;
    let reconciled = 0;
    let partially = 0;
    let conflict = 0;
    let failed = 0;
    let cancelled = 0;
    for (const manifest of all) {
      if (manifest.state === "PENDING") pending += 1;
      if (manifest.state === "CORRELATED") correlated += 1;
      if (manifest.state === "RECONCILING") reconciling += 1;
      if (manifest.state === "RECONCILED") reconciled += 1;
      if (manifest.state === "PARTIALLY_RECONCILED") partially += 1;
      if (manifest.state === "CONFLICT") conflict += 1;
      if (manifest.state === "FAILED") failed += 1;
      if (manifest.state === "CANCELLED") cancelled += 1;
    }
    return {
      kind: "canonical-reconciliation-statistics",
      totalManifests: all.length,
      totalContexts: this.contextCount(),
      totalCorrelations: this.correlationCount(),
      totalResults: this.resultCount(),
      pendingCount: pending,
      correlatedCount: correlated,
      reconcilingCount: reconciling,
      reconciledCount: reconciled,
      partiallyReconciledCount: partially,
      conflictCount: conflict,
      failedCount: failed,
      cancelledCount: cancelled,
      reconciliationImplementedCount: 0,
      conflictResolutionImplementedCount: 0,
      automaticMatchingImplementedCount: 0,
      workflowIntegrationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Reconciliation Runtime store ready (${this.manifestCount()} manifests, ${this.contextCount()} contexts, ${this.correlationCount()} correlations, ${this.resultCount()} results).`,
    };
  }
}
