/**
 * DefaultDocumentIntakeRuntimeAdapter — adapter default (DIP-01).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → DocumentIntakePort → Adapter
 *
 * NÃO reimplementa intake. NÃO cria adapters paralelos.
 * NÃO executa OCR, IA, XML, TISS, parser, classificação, Workflow ou Rule Engine.
 */
import { createRuntimeSessionId } from "../ports/identity";
import type { DocumentIntakeRuntimePort } from "../ports/document-intake-runtime-port";
import type { CanonicalDocumentIntakeSession } from "../ports/models";
import type {
  DocumentIntakeRuntimeCapabilities,
  DocumentIntakeRuntimeEnterpriseDeps,
  DocumentIntakeRuntimeHealth,
  GetIntakeRuntimeSessionInput,
  GetIntakeRuntimeSessionResult,
  ListIntakeRuntimeSessionsInput,
  ListIntakeRuntimeSessionsResult,
  RegisterIntakeInput,
  RegisterIntakeResult,
} from "../ports/types";
import { InMemoryDocumentIntakeRuntimeStore, type DocumentIntakeRuntimeStore } from "../store";

export const DEFAULT_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

export type DefaultDocumentIntakeRuntimeAdapterOptions = {
  /** Ports Enterprise obrigatórios — sem implementação paralela. */
  enterpriseDeps: DocumentIntakeRuntimeEnterpriseDeps;
  store?: DocumentIntakeRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): DocumentIntakeRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
    supportsRegisterIntake: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesDocumentIntakePort: true,
    implementsOcr: false,
    implementsAi: false,
    implementsXml: false,
    implementsTiss: false,
    implementsParser: false,
    implementsClassification: false,
    implementsWorkflow: false,
    implementsRuleEngine: false,
  };
}

export class DefaultDocumentIntakeRuntimeAdapter implements DocumentIntakeRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: DocumentIntakeRuntimeEnterpriseDeps;
  private readonly store: DocumentIntakeRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultDocumentIntakeRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultDocumentIntakeRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + DocumentIntakePort). Implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryDocumentIntakeRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): DocumentIntakeRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<DocumentIntakeRuntimeHealth> {
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
    const [orchestratorHealth, intakeHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getDocumentIntakePort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && intakeHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      documentIntakePortOk: intakeHealth.ok,
      message: ok
        ? "Document Intake Runtime pronto (Orchestrator + DocumentIntakePort)."
        : "Document Intake Runtime degradado — ver Ports Enterprise.",
    };
  }

  async registerIntake(input: RegisterIntakeInput): Promise<RegisterIntakeResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-intake-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
      };
    }

    let session: CanonicalDocumentIntakeSession = {
      kind: "canonical-document-intake-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.store.setSession(session);

    try {
      session = {
        ...session,
        status: "coordinating",
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const orchestrator = this.enterpriseDeps.getOrchestratorPort();
      const execution = await orchestrator.startExecution({
        correlationId: input.metadata.correlationId,
        tenantRef: input.metadata.tenantRef,
        channel: input.source.channel ?? input.metadata.channel ?? "document-intake-runtime",
        intakeRef: input.metadata.sessionId,
        documentRef: input.identity.documentId,
        tags: ["dip-01", "document-intake-runtime", ...(input.metadata.tags ?? [])],
        customAttributes: {
          source: input.source.sourceType,
          sessionId: input.metadata.sessionId,
          documentId: input.identity.documentId,
          ...(input.metadata.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ??
          "DIP-01: document intake registered via Document Intake Runtime (no OCR/IA).",
      });

      if (!execution.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          updatedAt: nowIso(this.now),
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
          errors: [execution.message ?? "ORCHESTRATOR_FAILED"],
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-intake-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          message: session.message,
          code: session.code,
        };
      }

      session = {
        ...session,
        status: "registering",
        executionId: execution.context?.executionId,
        updatedAt: nowIso(this.now),
      };
      this.store.setSession(session);

      const documentIntake = this.enterpriseDeps.getDocumentIntakePort();
      const intake = await documentIntake.createIntake({
        intake: {
          sourceType: input.source.sourceType,
          priority: "NORMAL",
          documentIdentityReference: {
            documentId: input.identity.documentId,
            kind: input.identity.documentKind ?? "capture-document",
            version: input.identity.version,
          },
          storageReference: input.reference?.storageKey
            ? {
                key: input.reference.storageKey,
                container: input.reference.storageContainer ?? "clinical-documents",
                provider: input.reference.storageProvider ?? "product-capture",
              }
            : undefined,
          metadataReference: {
            id: input.reference?.metadataId ?? input.metadata.sessionId,
            kind: "capture-session",
            namespace: input.reference?.metadataNamespace ?? "product.capture",
          },
          tags: ["dip-01", "document-intake-runtime", ...(input.metadata.tags ?? [])],
          customAttributes: {
            sessionId: input.metadata.sessionId,
            documentId: input.identity.documentId,
            tenantRef: input.metadata.tenantRef ?? null,
            correlationId: input.metadata.correlationId ?? null,
            executionId: execution.context?.executionId ?? null,
            runtimeSessionId,
            ...(input.metadata.customAttributes ?? {}),
          },
          capabilities: input.capabilities?.declared ?? ["document-intake-runtime"],
        },
      });

      if (!intake.ok) {
        session = {
          ...session,
          status: "failed",
          intakeId: intake.intakeId,
          updatedAt: nowIso(this.now),
          message: intake.message ?? "DocumentIntake createIntake falhou.",
          code: intake.code ?? "INTAKE_FAILED",
          errors: [intake.message ?? "INTAKE_FAILED"],
        };
        this.store.setSession(session);
        return {
          kind: "canonical-document-intake-result",
          ok: false,
          runtimeSessionId,
          session,
          intakeId: intake.intakeId,
          executionId: execution.context?.executionId,
          message: session.message,
          code: session.code,
        };
      }

      session = {
        ...session,
        status: "registered",
        intakeId: intake.intakeId,
        executionId: execution.context?.executionId,
        updatedAt: nowIso(this.now),
        message: "Document registered via Document Intake Runtime Ports.",
        code: "REGISTERED",
      };
      this.store.setSession(session);

      return {
        kind: "canonical-document-intake-result",
        ok: true,
        runtimeSessionId,
        session,
        intakeId: intake.intakeId,
        executionId: execution.context?.executionId,
        message: session.message,
        code: session.code,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
      };
      this.store.setSession(session);
      return {
        kind: "canonical-document-intake-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
      };
    }
  }

  async getSession(input: GetIntakeRuntimeSessionInput): Promise<GetIntakeRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListIntakeRuntimeSessionsInput = {},
  ): Promise<ListIntakeRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }
}

function matchesList(
  session: CanonicalDocumentIntakeSession,
  input: ListIntakeRuntimeSessionsInput,
): boolean {
  if (input.status != null && session.status !== input.status) return false;
  if (input.documentId != null && session.request.identity.documentId !== input.documentId) {
    return false;
  }
  if (input.sessionId != null && session.request.metadata.sessionId !== input.sessionId) {
    return false;
  }
  if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
    return false;
  }
  return true;
}
