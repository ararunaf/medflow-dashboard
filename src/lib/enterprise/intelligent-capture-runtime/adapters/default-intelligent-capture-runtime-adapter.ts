/**
 * DefaultIntelligentCaptureRuntimeAdapter — F3-CAP-04.
 *
 * Adapter oficial do Enterprise Intelligent Capture Runtime.
 * Responde exclusivamente de forma estrutural.
 * Sem OCR. Sem IA. Sem Pipeline. Sem captura automática. Sem leitura de arquivos.
 * Sem Scanner/Watch Folder/Upload reais.
 */
import {
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  toCanonicalCaptureCapabilities,
} from "../ports/capabilities";
import {
  INTELLIGENT_CAPTURE_RUNTIME_IDENTITY,
  createCaptureEnvelopeId,
  createCaptureRequestId,
  createCaptureResultId,
  createCaptureRouteId,
  createCaptureSourceId,
  createIntelligentCaptureRuntimeRequestId,
} from "../ports/identity";
import type { IntelligentCaptureRuntimePort } from "../ports/intelligent-capture-runtime-port";
import type {
  CaptureEnvelope,
  CaptureRequest,
  CaptureResult,
  CaptureRoute,
  CaptureSource,
} from "../ports/canonical";
import type {
  CloseCaptureRequestInput,
  CloseCaptureRequestResult,
  DiscoverCaptureSourcesInput,
  DiscoverCaptureSourcesResult,
  EnvelopeCaptureInput,
  EnvelopeCaptureResult,
  IntelligentCaptureRuntimeEnterpriseDeps,
  IntelligentCaptureRuntimeHealth,
  IntelligentCaptureRuntimeInfo,
  IntelligentCaptureRuntimeOperationEnvelope,
  IntelligentCaptureRuntimeOperationalControls,
  IntelligentCaptureRuntimePortCapabilities,
  IntelligentCaptureRuntimeProviderId,
  IntelligentCaptureRuntimeProviderMetadata,
  IntelligentCaptureRuntimeStructuredLog,
  OpenCaptureRequestInput,
  OpenCaptureRequestResult,
  RegisterCaptureSourceInput,
  RegisterCaptureSourceResult,
  RouteCaptureInput,
  RouteCaptureResult,
  CaptureStatsInput,
  CaptureStatsResult,
  UnregisterCaptureSourceInput,
  UnregisterCaptureSourceResult,
} from "../ports/types";
import {
  InMemoryIntelligentCaptureRuntimeStore,
  type IntelligentCaptureRuntimeStore,
} from "../store";

export const DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID =
  "default-enterprise-intelligent-capture";
export const DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION =
  INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.version;

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultIntelligentCaptureRuntimeAdapterOptions = {
  provider?: Extract<IntelligentCaptureRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: IntelligentCaptureRuntimeStore;
  enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: IntelligentCaptureRuntimeOperationalControls): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function portShapeOk(port: unknown): boolean {
  return (
    !!port &&
    typeof (port as { health?: unknown }).health === "function" &&
    typeof (port as { capabilities?: unknown }).capabilities === "function"
  );
}

function structuralFlags() {
  return {
    scannerIntegrationImplemented: false,
    watchFolderIntegrationImplemented: false,
    uploadIntegrationImplemented: false,
    capturePipelineImplemented: false,
    documentRoutingImplemented: false,
    automaticSelectionImplemented: false,
    automaticCaptureImplemented: false,
    ocrPipelineImplemented: false,
    classificationPipelineImplemented: false,
    processingPipelineImplemented: false,
  } as const;
}

/**
 * Adapter oficial F3-CAP-04 — Intelligent Capture Runtime default / enterprise.
 */
export class DefaultIntelligentCaptureRuntimeAdapter implements IntelligentCaptureRuntimePort {
  readonly providerId: Extract<IntelligentCaptureRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: IntelligentCaptureRuntimeProviderMetadata;
  private readonly store: IntelligentCaptureRuntimeStore;
  private readonly enterpriseDeps?: IntelligentCaptureRuntimeEnterpriseDeps;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultIntelligentCaptureRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Intelligent Capture Runtime ready (structural only — no OCR / no AI / no automatic capture).`;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Intelligent Capture Runtime"
          : INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.name,
      version: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
      vendor: INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.vendor,
      layer: INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.layer,
      vendorAgnostic: INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.vendorAgnostic,
      description: INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.description,
    };
    this.store = options.store ?? new InMemoryIntelligentCaptureRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): IntelligentCaptureRuntimeStore {
    return this.store;
  }

  capabilities(): IntelligentCaptureRuntimePortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
      engine: { ...DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES },
      canonical: toCanonicalCaptureCapabilities(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES),
      supportsCanonicalCapture: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesOCRRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      runtimeReady: true,
      ...structuralFlags(),
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): IntelligentCaptureRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "INTELLIGENT_CAPTURE_RUNTIME",
      capabilities: { ...DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<IntelligentCaptureRuntimeHealth> {
    const storeHealth = this.store.health();
    let scannerRuntimeOk = true;
    let watchFolderRuntimeOk = true;
    let uploadRuntimeOk = true;
    let ocrRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let schedulerRuntimeOk = true;
    let workerRuntimeOk = true;
    let observabilityRuntimeOk = true;

    if (this.enterpriseDeps) {
      // Deps estruturais — valida Port shape sem chamar health() (evita ciclos).
      if (typeof this.enterpriseDeps.getScannerRuntimePort === "function") {
        scannerRuntimeOk = portShapeOk(this.enterpriseDeps.getScannerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getWatchFolderRuntimePort === "function") {
        watchFolderRuntimeOk = portShapeOk(this.enterpriseDeps.getWatchFolderRuntimePort());
      }
      if (typeof this.enterpriseDeps.getUploadRuntimePort === "function") {
        uploadRuntimeOk = portShapeOk(this.enterpriseDeps.getUploadRuntimePort());
      }
      if (typeof this.enterpriseDeps.getOCRRuntimePort === "function") {
        ocrRuntimeOk = portShapeOk(this.enterpriseDeps.getOCRRuntimePort());
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        persistentQueueRuntimeOk = portShapeOk(this.enterpriseDeps.getPersistentQueueRuntimePort());
      }
      if (typeof this.enterpriseDeps.getSchedulerRuntimePort === "function") {
        schedulerRuntimeOk = portShapeOk(this.enterpriseDeps.getSchedulerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort === "function") {
        workerRuntimeOk = portShapeOk(this.enterpriseDeps.getWorkerRuntimePort());
      }
      if (typeof this.enterpriseDeps.getObservabilityRuntimePort === "function") {
        observabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getObservabilityRuntimePort());
      }
    }

    const ok =
      this.healthy &&
      storeHealth.ok &&
      scannerRuntimeOk &&
      watchFolderRuntimeOk &&
      uploadRuntimeOk &&
      ocrRuntimeOk &&
      persistentQueueRuntimeOk &&
      schedulerRuntimeOk &&
      workerRuntimeOk &&
      observabilityRuntimeOk;

    return {
      kind: "canonical-capture-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedSourceCount: this.store.sourceCount(),
      storedRequestCount: this.store.requestCount(),
      storedRouteCount: this.store.routeCount(),
      storedEnvelopeCount: this.store.envelopeCount(),
      scannerRuntimeOk,
      watchFolderRuntimeOk,
      uploadRuntimeOk,
      ocrRuntimeOk,
      persistentQueueRuntimeOk,
      schedulerRuntimeOk,
      workerRuntimeOk,
      observabilityRuntimeOk,
      runtimeReady: true,
      ...structuralFlags(),
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Intelligent Capture Runtime unhealthy.",
    };
  }

  async registerSource(input: RegisterCaptureSourceInput): Promise<RegisterCaptureSourceResult> {
    return this.runOperation("registerSource", input, async () => {
      const stamp = this.now();
      const sourceName = input.sourceName ?? "canonical-foundation-capture-source";
      const existing = input.sourceId
        ? this.store.getSource(input.sourceId)
        : this.store.getSourceByName(sourceName);
      if (existing) {
        return {
          ok: false,
          code: "INTELLIGENT_CAPTURE_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical CaptureSource already registered.",
          source: existing,
        };
      }
      const sourceId = input.sourceId ?? createCaptureSourceId();
      const origin = input.origin ?? "unknown";
      const channel = input.channel ?? "structural";
      const source: CaptureSource = {
        kind: "canonical-capture-source",
        sourceId,
        sourceName,
        origin,
        channel,
        identity: {
          kind: "canonical-capture-identity",
          sourceId,
          sourceName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        discovered: false,
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setSource(source);
      const result = this.buildResult({
        operation: "registerSource",
        status: "registered",
        source,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural registerSource (F3-CAP-04 foundation — no real capture).",
      });
      return {
        ok: true,
        result,
        source,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregisterSource(
    input: UnregisterCaptureSourceInput,
  ): Promise<UnregisterCaptureSourceResult> {
    return this.runOperation("unregisterSource", input, async () => {
      const existing = this.store.getSource(input.sourceId);
      if (!existing) {
        return {
          ok: false,
          code: "INTELLIGENT_CAPTURE_RUNTIME_NOT_FOUND",
          message: "Canonical CaptureSource not found.",
        };
      }
      const stamp = this.now();
      const source: CaptureSource = {
        ...existing,
        status: "unregistered",
        updatedAt: stamp,
      };
      this.store.removeSource(input.sourceId);
      const result = this.buildResult({
        operation: "unregisterSource",
        status: "unregistered",
        source,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural unregisterSource (F3-CAP-04 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        source,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async discoverSources(
    input: DiscoverCaptureSourcesInput = {},
  ): Promise<DiscoverCaptureSourcesResult> {
    return this.runOperation("discoverSources", input, async () => {
      const stamp = this.now();
      const sources = this.store.listSources().map((source) => {
        const discovered: CaptureSource = {
          ...source,
          discovered: true,
          status: source.status === "unregistered" ? source.status : "discovered",
          updatedAt: stamp,
        };
        this.store.setSource(discovered);
        return discovered;
      });
      const result = this.buildResult({
        operation: "discoverSources",
        status: "discovered",
        sources,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural discoverSources (F3-CAP-04 foundation — no Scanner/WatchFolder/Upload enumeration).",
      });
      return {
        ok: true,
        result,
        sources,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async openRequest(input: OpenCaptureRequestInput): Promise<OpenCaptureRequestResult> {
    return this.runOperation("openRequest", input, async () => {
      const stamp = this.now();
      let source = this.resolveSource(input.sourceId, input.sourceName);
      if (!source) {
        const sourceName = input.sourceName ?? "canonical-foundation-capture-source";
        const sourceId = input.sourceId ?? createCaptureSourceId();
        const origin = input.origin ?? "unknown";
        const channel = input.channel ?? "structural";
        source = {
          kind: "canonical-capture-source",
          sourceId,
          sourceName,
          origin,
          channel,
          identity: {
            kind: "canonical-capture-identity",
            sourceId,
            sourceName,
          },
          metadata: input.metadata,
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setSource(source);
      }
      const requestId = input.captureRequestId ?? createCaptureRequestId();
      const request: CaptureRequest = {
        kind: "canonical-capture-request",
        requestId,
        sourceId: source.sourceId,
        origin: input.origin ?? source.origin,
        channel: input.channel ?? source.channel,
        identity: {
          kind: "canonical-capture-identity",
          sourceId: source.sourceId,
          sourceName: source.sourceName,
          requestId,
        },
        metadata: input.metadata,
        status: "request-open",
        openedAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setRequest(request);
      const updated: CaptureSource = {
        ...source,
        status: "request-open",
        updatedAt: stamp,
      };
      this.store.setSource(updated);
      const result = this.buildResult({
        operation: "openRequest",
        status: "request-open",
        source: updated,
        request,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural openRequest (F3-CAP-04 foundation — no automatic capture).",
      });
      return {
        ok: true,
        result,
        source: updated,
        request,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async closeRequest(input: CloseCaptureRequestInput): Promise<CloseCaptureRequestResult> {
    return this.runOperation("closeRequest", input, async () => {
      const existing = this.store.getRequest(input.captureRequestId);
      if (!existing) {
        return {
          ok: false,
          code: "INTELLIGENT_CAPTURE_RUNTIME_REQUEST_NOT_FOUND",
          message: "Canonical CaptureRequest not found.",
        };
      }
      const stamp = this.now();
      const request: CaptureRequest = {
        ...existing,
        status: "request-closed",
        closedAt: stamp,
        updatedAt: stamp,
      };
      this.store.setRequest(request);
      const result = this.buildResult({
        operation: "closeRequest",
        status: "request-closed",
        request,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural closeRequest (F3-CAP-04 foundation — no real close).",
      });
      return {
        ok: true,
        result,
        request,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async route(input: RouteCaptureInput): Promise<RouteCaptureResult> {
    return this.runOperation("route", input, async () => {
      const stamp = this.now();
      let source = this.resolveSource(input.sourceId, input.sourceName);
      if (!source) {
        source = {
          kind: "canonical-capture-source",
          sourceId: input.sourceId ?? createCaptureSourceId(),
          sourceName: input.sourceName ?? "canonical-foundation-capture-source",
          origin: input.origin ?? "unknown",
          channel: input.channel ?? "structural",
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setSource(source);
      }
      let request = input.captureRequestId
        ? this.store.getRequest(input.captureRequestId)
        : undefined;
      if (!request) {
        const requestId = createCaptureRequestId();
        request = {
          kind: "canonical-capture-request",
          requestId,
          sourceId: source.sourceId,
          origin: input.origin ?? source.origin,
          channel: input.channel ?? source.channel,
          identity: {
            kind: "canonical-capture-identity",
            sourceId: source.sourceId,
            sourceName: source.sourceName,
            requestId,
          },
          metadata: input.metadata,
          status: "request-open",
          openedAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setRequest(request);
      }
      const targetRuntime =
        input.targetRuntime ??
        (source.origin === "scanner" ||
        source.origin === "watch-folder" ||
        source.origin === "upload"
          ? source.origin
          : "structural");
      const route: CaptureRoute = {
        kind: "canonical-capture-route",
        routeId: createCaptureRouteId(),
        sourceId: source.sourceId,
        requestId: request.requestId,
        origin: input.origin ?? source.origin,
        channel: input.channel ?? source.channel,
        targetRuntime,
        identity: {
          kind: "canonical-capture-identity",
          sourceId: source.sourceId,
          requestId: request.requestId,
        },
        metadata: input.metadata,
        status: "routed",
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setRoute(route);
      const result = this.buildResult({
        operation: "route",
        status: "routed",
        source,
        request,
        route,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural route (F3-CAP-04 foundation — no document routing / no automatic selection).",
      });
      return {
        ok: true,
        result,
        source,
        request,
        route,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async envelope(input: EnvelopeCaptureInput): Promise<EnvelopeCaptureResult> {
    return this.runOperation("envelope", input, async () => {
      const stamp = this.now();
      let source = this.resolveSource(input.sourceId, input.sourceName);
      if (!source) {
        source = {
          kind: "canonical-capture-source",
          sourceId: input.sourceId ?? createCaptureSourceId(),
          sourceName: input.sourceName ?? "canonical-foundation-capture-source",
          origin: input.origin ?? "unknown",
          channel: input.channel ?? "structural",
          status: "registered",
          discovered: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setSource(source);
      }
      let request = input.captureRequestId
        ? this.store.getRequest(input.captureRequestId)
        : undefined;
      if (!request) {
        const requestId = createCaptureRequestId();
        request = {
          kind: "canonical-capture-request",
          requestId,
          sourceId: source.sourceId,
          origin: input.origin ?? source.origin,
          channel: input.channel ?? source.channel,
          identity: {
            kind: "canonical-capture-identity",
            sourceId: source.sourceId,
            sourceName: source.sourceName,
            requestId,
          },
          metadata: input.metadata,
          status: "request-open",
          openedAt: stamp,
          updatedAt: stamp,
          ...structuralFlags(),
        };
        this.store.setRequest(request);
      }
      const route = input.routeId ? this.store.getRoute(input.routeId) : undefined;
      const envelope: CaptureEnvelope = {
        kind: "canonical-capture-envelope",
        envelopeId: createCaptureEnvelopeId(),
        sourceId: source.sourceId,
        requestId: request.requestId,
        routeId: route?.routeId,
        origin: input.origin ?? source.origin,
        channel: input.channel ?? source.channel,
        identity: {
          kind: "canonical-capture-identity",
          sourceId: source.sourceId,
          requestId: request.requestId,
          routeId: route?.routeId,
        },
        metadata: input.metadata,
        status: "enveloped",
        createdAt: stamp,
        updatedAt: stamp,
        ...structuralFlags(),
      };
      this.store.setEnvelope(envelope);
      const result = this.buildResult({
        operation: "envelope",
        status: "enveloped",
        source,
        request,
        route,
        envelope,
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText:
          "Canonical Intelligent Capture Runtime structural envelope (F3-CAP-04 foundation — no file packaging / no document processing).",
      });
      return {
        ok: true,
        result,
        source,
        request,
        route,
        envelope,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async stats(input: CaptureStatsInput = {}): Promise<CaptureStatsResult> {
    return this.runOperation("stats", input, async () => {
      const statistics = this.store.statistics();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: "INTELLIGENT_CAPTURE_RUNTIME_STRUCTURAL_OK",
        messageText: "Canonical Intelligent Capture Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "INTELLIGENT_CAPTURE_RUNTIME_OK",
        message: `Intelligent Capture Runtime stats: ${statistics.totalSources} sources, ${statistics.totalRoutes} routes, ${statistics.totalEnvelopes} envelopes.`,
      };
    });
  }

  private resolveSource(
    sourceId: string | undefined,
    sourceName: string | undefined,
  ): CaptureSource | undefined {
    if (sourceId) {
      const byId = this.store.getSource(sourceId);
      if (byId) return byId;
    }
    if (sourceName) return this.store.getSourceByName(sourceName);
    const all = this.store.listSources();
    return all[0];
  }

  private buildResult(args: {
    operation: CaptureResult["operation"];
    status: CaptureResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    source?: CaptureSource;
    request?: CaptureRequest;
    route?: CaptureRoute;
    envelope?: CaptureEnvelope;
    sources?: readonly CaptureSource[];
  }): CaptureResult {
    return {
      kind: "canonical-capture-result",
      ok: true,
      resultId: createCaptureResultId(),
      operation: args.operation,
      source: args.source,
      request: args.request,
      route: args.route,
      envelope: args.envelope,
      sources: args.sources,
      provider: {
        kind: "canonical-capture-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      ...structuralFlags(),
      runtimeReady: true,
      status: args.status,
      messageText: args.messageText,
      code: args.code,
      createdAt: args.stamp,
      updatedAt: args.stamp,
    };
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: IntelligentCaptureRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & IntelligentCaptureRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createIntelligentCaptureRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: IntelligentCaptureRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "INTELLIGENT_CAPTURE_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & IntelligentCaptureRuntimeOperationEnvelope;
        }

        try {
          if (this.failAttemptsRemaining > 0) {
            this.failAttemptsRemaining -= 1;
            throw new Error("Forced transient failure (test).");
          }

          const body = await this.withTimeout(fn(), timeoutMs, signal);
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          logs.push({
            level: "info",
            code: body.code ?? "INTELLIGENT_CAPTURE_RUNTIME_OK",
            message: body.message ?? `${operation} completed`,
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          return {
            ...body,
            requestId,
            provider: this.providerId,
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: false,
              operation,
            },
            logs,
          };
        } catch (err) {
          lastError = err;
          logs.push({
            level: "warn",
            code: "INTELLIGENT_CAPTURE_RUNTIME_RETRY",
            message: err instanceof Error ? err.message : String(err),
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * (attempt + 1));
          }
        }
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "INTELLIGENT_CAPTURE_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & IntelligentCaptureRuntimeOperationEnvelope;
    } catch (err) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || /timeout/i.test(err.message));
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "INTELLIGENT_CAPTURE_RUNTIME_CANCELLED"
          : isTimeout
            ? "INTELLIGENT_CAPTURE_RUNTIME_TIMEOUT"
            : "INTELLIGENT_CAPTURE_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & IntelligentCaptureRuntimeOperationEnvelope;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs <= 0 && !signal) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              const err = new Error(
                `Intelligent Capture Runtime operation timed out after ${timeoutMs}ms`,
              );
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Intelligent Capture Runtime operation aborted");
              err.name = "AbortError";
              reject(err);
            };
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter enterprise (F3-CAP-04). */
export const EnterpriseIntelligentCaptureRuntimeAdapter = DefaultIntelligentCaptureRuntimeAdapter;
