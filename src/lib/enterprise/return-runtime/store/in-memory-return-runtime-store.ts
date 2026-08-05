/**
 * InMemoryReturnRuntimeStore — store in-process oficial (C-08).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem processamento de retorno, sem correlação automática, sem reconciliação).
 */
import type { ReturnStatistics } from "../ports/canonical";
import type {
  ReturnRuntimeStore,
  StoredReturnContext,
  StoredReturnCorrelation,
  StoredReturnManifest,
} from "./return-runtime-store";

export const IN_MEMORY_RETURN_RUNTIME_STORE_ID = "in-memory-return-runtime";

export type InMemoryReturnRuntimeStoreOptions = {
  manifests?: readonly StoredReturnManifest[];
  contexts?: readonly StoredReturnContext[];
  correlations?: readonly StoredReturnCorrelation[];
};

export class InMemoryReturnRuntimeStore implements ReturnRuntimeStore {
  readonly storeId = IN_MEMORY_RETURN_RUNTIME_STORE_ID;

  private readonly manifests = new Map<string, StoredReturnManifest>();
  private readonly contexts = new Map<string, StoredReturnContext>();
  private readonly correlations = new Map<string, StoredReturnCorrelation>();

  constructor(options: InMemoryReturnRuntimeStoreOptions = {}) {
    for (const manifest of options.manifests ?? []) this.setManifest(manifest);
    for (const context of options.contexts ?? []) this.setContext(context);
    for (const correlation of options.correlations ?? []) this.setCorrelation(correlation);
  }

  getManifest(returnId: string): StoredReturnManifest | undefined {
    const manifest = this.manifests.get(returnId);
    return manifest ? { ...manifest } : undefined;
  }

  setManifest(manifest: StoredReturnManifest): void {
    const key = manifest.returnId ?? `return-${this.manifests.size + 1}`;
    this.manifests.set(key, { ...manifest, returnId: key });
  }

  listManifests(): readonly StoredReturnManifest[] {
    return Array.from(this.manifests.values()).map((manifest) => ({ ...manifest }));
  }

  manifestCount(): number {
    return this.manifests.size;
  }

  getContext(contextId: string): StoredReturnContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredReturnContext): void {
    const key = context.contextId ?? context.returnId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredReturnContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  getCorrelation(correlationId: string): StoredReturnCorrelation | undefined {
    const correlation = this.correlations.get(correlationId);
    return correlation ? { ...correlation } : undefined;
  }

  setCorrelation(correlation: StoredReturnCorrelation): void {
    const key = correlation.correlationId ?? `correlation-${this.correlations.size + 1}`;
    this.correlations.set(key, { ...correlation, correlationId: key });
  }

  listCorrelations(): readonly StoredReturnCorrelation[] {
    return Array.from(this.correlations.values()).map((correlation) => ({ ...correlation }));
  }

  correlationCount(): number {
    return this.correlations.size;
  }

  statistics(): ReturnStatistics {
    const all = this.listManifests();
    let received = 0;
    let correlated = 0;
    let validated = 0;
    let ready = 0;
    let processed = 0;
    let rejected = 0;
    let failed = 0;
    let duplicated = 0;
    let ignored = 0;
    for (const manifest of all) {
      if (manifest.state === "RECEIVED") received += 1;
      if (manifest.state === "CORRELATED") correlated += 1;
      if (manifest.state === "VALIDATED") validated += 1;
      if (manifest.state === "READY_FOR_PROCESSING") ready += 1;
      if (manifest.state === "PROCESSED" || manifest.state === "PARTIALLY_PROCESSED")
        processed += 1;
      if (manifest.state === "REJECTED") rejected += 1;
      if (manifest.state === "FAILED" || manifest.state === "TIMEOUT") failed += 1;
      if (manifest.state === "DUPLICATED") duplicated += 1;
      if (manifest.state === "IGNORED") ignored += 1;
    }
    return {
      kind: "canonical-return-statistics",
      totalManifests: all.length,
      totalContexts: this.contextCount(),
      totalCorrelations: this.correlationCount(),
      receivedCount: received,
      correlatedCount: correlated,
      validatedCount: validated,
      readyForProcessingCount: ready,
      processedCount: processed,
      rejectedCount: rejected,
      failedCount: failed,
      duplicatedCount: duplicated,
      ignoredCount: ignored,
      returnProcessedCount: 0,
      returnProcessingImplementedCount: 0,
      automaticCorrelationImplementedCount: 0,
      statusUpdateImplementedCount: 0,
      reconciliationImplementedCount: 0,
      workflowIntegrationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Return Runtime store ready (${this.manifestCount()} manifests, ${this.contextCount()} contexts, ${this.correlationCount()} correlations).`,
    };
  }
}
