/**
 * DefaultTISSRuntimeAdapter — TISS-01 / TISS-02 / TISS-03 / TISS-04.
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   TISSCatalogPort → Catalog Adapter → Store
 *   RulePackEnginePort → Rule Pack Adapter → Store
 *   XMLRuntimePort → XML Adapter → Store
 *   Canonical Execution Orchestrator → TISSProviderPort → Adapter
 *
 * NÃO chama XML real/operadoras/banco/Storage/OCR diretamente.
 * NÃO acessa Catalog Store / Rule Pack Store / XML Store diretamente — apenas via Ports.
 */
import { createTISSRuntimeSessionId } from "../ports/identity";
import type { TISSRuntimePort } from "../ports/tiss-runtime-port";
import type { CanonicalTISSRuntimeSession } from "../ports/models";
import type {
  GetTISSRuntimeSessionInput,
  GetTISSRuntimeSessionResult,
  ListTISSRuntimeSessionsInput,
  ListTISSRuntimeSessionsResult,
  RuntimeTISSProcessInput,
  RuntimeTISSProcessResult,
  TISSRuntimeCapabilities,
  TISSRuntimeEnterpriseDeps,
  TISSRuntimeHealth,
} from "../ports/types";
import { InMemoryTISSRuntimeStore, type TISSRuntimeStore } from "../store";

export const DEFAULT_TISS_RUNTIME_ADAPTER_ID = "default-enterprise-tiss-runtime";

export type DefaultTISSRuntimeAdapterOptions = {
  enterpriseDeps: TISSRuntimeEnterpriseDeps;
  store?: TISSRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): TISSRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_TISS_RUNTIME_ADAPTER_ID,
    supportsProcess: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesTISSProviderPort: true,
    usesTISSCatalogPort: true,
    usesRulePackEnginePort: true,
    usesXMLRuntimePort: true,
    implementsRealXml: false,
    implementsOperatorDispatch: false,
  };
}

export class DefaultTISSRuntimeAdapter implements TISSRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: TISSRuntimeEnterpriseDeps;
  private readonly store: TISSRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultTISSRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultTISSRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + TISSProviderPort + TISSCatalogPort + RulePackEnginePort + XMLRuntimePort). " +
          "Bypass / implementação paralela é proibida.",
      );
    }
    if (typeof options.enterpriseDeps.getTISSCatalogPort !== "function") {
      throw new Error(
        "DefaultTISSRuntimeAdapter exige enterpriseDeps.getTISSCatalogPort (TISS-02).",
      );
    }
    if (typeof options.enterpriseDeps.getRulePackEnginePort !== "function") {
      throw new Error(
        "DefaultTISSRuntimeAdapter exige enterpriseDeps.getRulePackEnginePort (TISS-03).",
      );
    }
    if (typeof options.enterpriseDeps.getXMLRuntimePort !== "function") {
      throw new Error(
        "DefaultTISSRuntimeAdapter exige enterpriseDeps.getXMLRuntimePort (TISS-04).",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryTISSRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createTISSRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): TISSRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<TISSRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
      };
    }

    const storeHealth = this.store.health();
    const catalogPort = this.enterpriseDeps.getTISSCatalogPort();
    const rulePackEnginePort = this.enterpriseDeps.getRulePackEnginePort();
    const xmlRuntimePort = this.enterpriseDeps.getXMLRuntimePort();
    const [
      orchestratorHealth,
      tissProviderHealth,
      tissCatalogHealth,
      rulePackEngineHealth,
      xmlRuntimeHealth,
    ] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getTISSProviderPort().health(),
      catalogPort.health(),
      rulePackEnginePort.health(),
      xmlRuntimePort.health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok =
      storeHealth.ok &&
      orchestratorHealth.ok &&
      tissProviderHealth.ok &&
      tissCatalogHealth.ok &&
      rulePackEngineHealth.ok &&
      xmlRuntimeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      tissProviderAdapterOk: tissProviderHealth.ok,
      tissCatalogOk: tissCatalogHealth.ok,
      rulePackEngineOk: rulePackEngineHealth.ok,
      xmlRuntimeOk: xmlRuntimeHealth.ok,
      message: ok
        ? "TISS Runtime pronto (Orchestrator + TISSCatalogPort + RulePackEnginePort + XMLRuntimePort + TISSProviderPort — sem bypass)."
        : "TISS Runtime degradado — ver Ports Enterprise.",
    };
  }

  async process(input: RuntimeTISSProcessInput): Promise<RuntimeTISSProcessResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const tissProvider = this.enterpriseDeps.getTISSProviderPort();
    const providerCaps = tissProvider.capabilities();
    const catalogPort = this.enterpriseDeps.getTISSCatalogPort();
    const rulePackEnginePort = this.enterpriseDeps.getRulePackEnginePort();
    const xmlRuntimePort = this.enterpriseDeps.getXMLRuntimePort();

    let catalogId: string | undefined;
    let processedViaTISSCatalogPort = false;
    const catalogResult = await catalogPort.getCatalog({
      requestId: input.requestId,
      signal: input.signal,
      timeoutMs: input.timeoutMs,
      retryCount: input.retryCount,
      attributes: input.attributes,
    });
    if (catalogResult.ok && catalogResult.catalog) {
      catalogId = catalogResult.catalog.catalogId;
      processedViaTISSCatalogPort = true;
    }

    let rulePackExecutionId: string | undefined;
    let rulePackCode: string | undefined;
    let processedViaRulePackEnginePort = false;
    try {
      const packExecution = await rulePackEnginePort.executePack({
        requestId: input.requestId,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        attributes: input.attributes,
      });
      if (packExecution.ok && packExecution.execution) {
        rulePackExecutionId = packExecution.execution.executionId;
        rulePackCode = packExecution.execution.packCode;
        processedViaRulePackEnginePort = true;
        if (!catalogId && packExecution.execution.catalogId) {
          catalogId = packExecution.execution.catalogId;
        }
      }
    } catch {
      // Best-effort Rule Pack Engine — não bloqueia process via Port.
    }

    let xmlGenerationId: string | undefined;
    let processedViaXMLRuntimePort = false;
    try {
      const xmlGeneration = await xmlRuntimePort.generate({
        requestId: input.requestId,
        signal: input.signal,
        timeoutMs: input.timeoutMs,
        retryCount: input.retryCount,
        attributes: input.attributes,
        documentId: input.documentId,
        rulePackCode,
        request: {
          kind: "canonical-xml-request",
          documentId: input.documentId,
          rulePackCode,
          metadata: {
            kind: "canonical-xml-metadata",
            sessionId: input.metadata.sessionId,
            correlationId: input.metadata.correlationId,
            channel: input.metadata.channel ?? "tiss-runtime",
            tags: ["tiss-04", "tiss-runtime", ...(input.metadata.tags ?? [])],
          },
          structuralNotes:
            "TISS Runtime → XMLRuntimePort structural generate (TISS-04 — no real XML).",
        },
      });
      if (xmlGeneration.ok && xmlGeneration.generation) {
        xmlGenerationId = xmlGeneration.generation.generationId;
        processedViaXMLRuntimePort = true;
        if (!catalogId && xmlGeneration.generation.catalogId) {
          catalogId = xmlGeneration.generation.catalogId;
        }
        if (!rulePackExecutionId && xmlGeneration.generation.rulePackExecutionId) {
          rulePackExecutionId = xmlGeneration.generation.rulePackExecutionId;
        }
        if (!rulePackCode && xmlGeneration.generation.rulePackCode) {
          rulePackCode = xmlGeneration.generation.rulePackCode;
        }
      }
    } catch {
      // Best-effort XML Runtime — não bloqueia process via Port.
    }

    let session: CanonicalTISSRuntimeSession = {
      kind: "canonical-tiss-runtime-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-tiss-request",
        mode: input.mode,
        metadata: input.metadata,
        documentId: input.documentId,
        profileReference: input.profileReference,
        providerReference: input.providerReference,
        structuralNotes: input.structuralNotes,
      },
      metadata: input.metadata,
      tissProviderAdapterId: providerCaps.adapterId,
      tissCatalogId: catalogId,
      rulePackExecutionId,
      rulePackCode,
      xmlGenerationId,
      processedViaTISSProviderPort: true,
      processedViaTISSCatalogPort,
      processedViaRulePackEnginePort,
      processedViaXMLRuntimePort,
      realTissExecuted: false,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "processing", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort();
        const execution = await orchestrator.startExecution({
          correlationId: input.metadata.correlationId,
          tenantRef: input.metadata.tenantRef,
          channel: input.metadata.channel ?? "tiss-runtime",
          tags: [
            "tiss-01",
            "tiss-02",
            "tiss-03",
            "tiss-04",
            "tiss-runtime",
            ...(input.metadata.tags ?? []),
          ],
          customAttributes: {
            source: "tiss-runtime-process",
            sessionId: input.metadata.sessionId,
            documentId: input.documentId ?? null,
            providerId: tissProvider.providerId,
            adapterId: providerCaps.adapterId,
            mode: input.mode,
            catalogId: catalogId ?? null,
            rulePackExecutionId: rulePackExecutionId ?? null,
            rulePackCode: rulePackCode ?? null,
            xmlGenerationId: xmlGenerationId ?? null,
          },
          structuralNotes:
            "TISS Runtime → TISSCatalogPort + RulePackEnginePort + XMLRuntimePort + TISSProviderPort (no real XML / no operator logic).",
        });
        if (execution.ok) {
          session = {
            ...session,
            executionId: execution.context?.executionId,
            updatedAt: nowIso(this.now),
          };
          this.store.setSession(session);
        }
      } catch {
        // Best-effort orchestrator — não bloqueia process via Port.
      }

      const result = await tissProvider.process(input);

      session = {
        ...session,
        status: result.ok
          ? "coordinated"
          : result.code === "TISS_CANCELLED"
            ? "cancelled"
            : "failed",
        result: {
          kind: "canonical-tiss-result",
          ok: result.ok,
          request: result.request,
          metadata: result.metadata,
          profileReference: result.profileReference,
          providerReference: result.providerReference,
          requestId: result.requestId,
          message: result.message,
          code: result.code,
          realTissExecuted: result.realTissExecuted,
        },
        profileReference: result.profileReference,
        providerReference: result.providerReference,
        realTissExecuted: result.realTissExecuted,
        message: result.message,
        code: result.code,
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      return {
        ...result,
        runtimeSessionId,
        executionId: session.executionId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        message,
        code: "TISS_RUNTIME_FAILED",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);
      return {
        kind: "canonical-tiss-result",
        ok: false,
        requestId: input.requestId,
        request: session.request,
        metadata: input.metadata,
        message,
        code: "TISS_RUNTIME_FAILED",
        realTissExecuted: false,
        provider: tissProvider.providerId,
        simulated: false,
        telemetry: {
          latencyMs: 0,
          attempts: 0,
          cancelled: false,
          mode: input.mode,
        },
        runtimeSessionId,
        executionId: session.executionId,
      };
    }
  }

  async getSession(input: GetTISSRuntimeSessionInput): Promise<GetTISSRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return {
        ok: false,
        message: "Sessão TISS Runtime não encontrada.",
        code: "TISS_RUNTIME_SESSION_NOT_FOUND",
      };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListTISSRuntimeSessionsInput = {},
  ): Promise<ListTISSRuntimeSessionsResult> {
    let sessions = this.store.listSessions();
    if (input.status) {
      sessions = sessions.filter((s) => s.status === input.status);
    }
    if (input.idPrefix) {
      sessions = sessions.filter((s) => s.runtimeSessionId.startsWith(input.idPrefix!));
    }
    if (input.correlationId) {
      sessions = sessions.filter((s) => s.metadata?.correlationId === input.correlationId);
    }
    return { ok: true, sessions };
  }
}
