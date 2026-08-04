/**
 * InMemoryIntelligentCaptureRuntimeStore — store in-process (F3-CAP-04).
 *
 * Implementação oficial do Intelligent Capture Runtime Store.
 * Sem banco. Sem OCR. Sem IA. Sem captura. Sem leitura de arquivos.
 */
import type { CanonicalCaptureStatistics } from "../ports/canonical";
import type {
  StoredCaptureEnvelope,
  StoredCaptureRequest,
  StoredCaptureRoute,
  StoredCaptureSource,
  IntelligentCaptureRuntimeStore,
} from "./intelligent-capture-runtime-store";

export const IN_MEMORY_INTELLIGENT_CAPTURE_RUNTIME_STORE_ID =
  "in-memory-intelligent-capture-runtime";

export type InMemoryIntelligentCaptureRuntimeStoreOptions = {
  sources?: readonly StoredCaptureSource[];
  requests?: readonly StoredCaptureRequest[];
  routes?: readonly StoredCaptureRoute[];
  envelopes?: readonly StoredCaptureEnvelope[];
};

/**
 * Store de sources/requests/routes/envelopes canônicos in-memory — exclusivo do Adapter (F3-CAP-04).
 */
export class InMemoryIntelligentCaptureRuntimeStore implements IntelligentCaptureRuntimeStore {
  readonly storeId = IN_MEMORY_INTELLIGENT_CAPTURE_RUNTIME_STORE_ID;

  private readonly sources = new Map<string, StoredCaptureSource>();
  private readonly byName = new Map<string, string>();
  private readonly requests = new Map<string, StoredCaptureRequest>();
  private readonly routes = new Map<string, StoredCaptureRoute>();
  private readonly envelopes = new Map<string, StoredCaptureEnvelope>();

  constructor(options: InMemoryIntelligentCaptureRuntimeStoreOptions = {}) {
    for (const source of options.sources ?? []) {
      this.setSource(source);
    }
    for (const request of options.requests ?? []) {
      this.setRequest(request);
    }
    for (const route of options.routes ?? []) {
      this.setRoute(route);
    }
    for (const envelope of options.envelopes ?? []) {
      this.setEnvelope(envelope);
    }
  }

  getSource(sourceId: string): StoredCaptureSource | undefined {
    const source = this.sources.get(sourceId);
    return source ? { ...source } : undefined;
  }

  getSourceByName(sourceName: string): StoredCaptureSource | undefined {
    const sourceId = this.byName.get(sourceName);
    if (!sourceId) return undefined;
    return this.getSource(sourceId);
  }

  setSource(source: StoredCaptureSource): void {
    this.sources.set(source.sourceId, { ...source });
    this.byName.set(source.sourceName, source.sourceId);
  }

  removeSource(sourceId: string): void {
    const existing = this.sources.get(sourceId);
    if (existing) {
      this.byName.delete(existing.sourceName);
      this.sources.delete(sourceId);
    }
  }

  listSources(): readonly StoredCaptureSource[] {
    return Array.from(this.sources.values()).map((source) => ({ ...source }));
  }

  getRequest(requestId: string): StoredCaptureRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredCaptureRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(sourceId?: string): readonly StoredCaptureRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!sourceId) return all;
    return all.filter((request) => request.sourceId === sourceId);
  }

  getRoute(routeId: string): StoredCaptureRoute | undefined {
    const route = this.routes.get(routeId);
    return route ? { ...route } : undefined;
  }

  setRoute(route: StoredCaptureRoute): void {
    this.routes.set(route.routeId, { ...route });
  }

  listRoutes(sourceId?: string): readonly StoredCaptureRoute[] {
    const all = Array.from(this.routes.values()).map((route) => ({ ...route }));
    if (!sourceId) return all;
    return all.filter((route) => route.sourceId === sourceId);
  }

  getEnvelope(envelopeId: string): StoredCaptureEnvelope | undefined {
    const envelope = this.envelopes.get(envelopeId);
    return envelope ? { ...envelope } : undefined;
  }

  setEnvelope(envelope: StoredCaptureEnvelope): void {
    this.envelopes.set(envelope.envelopeId, { ...envelope });
  }

  listEnvelopes(sourceId?: string): readonly StoredCaptureEnvelope[] {
    const all = Array.from(this.envelopes.values()).map((envelope) => ({ ...envelope }));
    if (!sourceId) return all;
    return all.filter((envelope) => envelope.sourceId === sourceId);
  }

  sourceCount(): number {
    return this.sources.size;
  }

  requestCount(): number {
    return this.requests.size;
  }

  routeCount(): number {
    return this.routes.size;
  }

  envelopeCount(): number {
    return this.envelopes.size;
  }

  statistics(): CanonicalCaptureStatistics {
    const all = this.listSources();
    let registered = 0;
    let discovered = 0;
    for (const source of all) {
      if (source.status === "registered") registered += 1;
      if (source.discovered || source.status === "discovered") discovered += 1;
    }
    const requests = this.listRequests();
    let openRequests = 0;
    let closedRequests = 0;
    for (const request of requests) {
      if (request.status === "request-open") openRequests += 1;
      if (request.status === "request-closed") closedRequests += 1;
    }
    return {
      kind: "canonical-capture-statistics",
      totalSources: all.length,
      registeredSources: registered,
      discoveredSources: discovered,
      openRequests,
      closedRequests,
      totalRoutes: this.routeCount(),
      totalEnvelopes: this.envelopeCount(),
      scannerIntegrationImplementedCount: 0,
      watchFolderIntegrationImplementedCount: 0,
      uploadIntegrationImplementedCount: 0,
      capturePipelineImplementedCount: 0,
      documentRoutingImplementedCount: 0,
      automaticSelectionImplementedCount: 0,
      automaticCaptureImplementedCount: 0,
      ocrPipelineImplementedCount: 0,
      classificationPipelineImplementedCount: 0,
      processingPipelineImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Intelligent Capture Runtime store ready (${this.sourceCount()} sources, ${this.requestCount()} requests, ${this.routeCount()} routes, ${this.envelopeCount()} envelopes).`,
    };
  }
}
