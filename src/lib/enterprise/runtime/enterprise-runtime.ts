/**
 * DefaultEnterpriseRuntime — composição oficial da Foundation (ARCH-01).
 *
 * Ponto único de acesso do produto aos Ports Enterprise.
 * Coordena via Canonical Execution Orchestrator; registra Intake via DocumentIntakePort.
 * Não executa OCR, IA, parser, TISS, filas ou workers reais.
 */
import { createCanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import { createDocumentIntakePort } from "../document-intake/providers/create-document-intake-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import type {
  EnterpriseRuntime,
  EnterpriseRuntimeHealth,
  EnterpriseRuntimeOptions,
  RegisterCaptureDocumentIntakeInput,
  RegisterCaptureDocumentIntakeResult,
} from "./types";

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export class DefaultEnterpriseRuntime implements EnterpriseRuntime {
  readonly runtimeId;
  private readonly documentIntakePort: DocumentIntakePort;
  private readonly orchestratorPort: CanonicalExecutionOrchestratorPort;

  constructor(options: EnterpriseRuntimeOptions = {}) {
    this.runtimeId = options.runtimeId ?? "default";
    this.documentIntakePort =
      options.documentIntakePort ?? createDocumentIntakePort({ provider: "default" });
    this.orchestratorPort =
      options.orchestratorPort ?? createCanonicalExecutionOrchestratorPort({ provider: "default" });
  }

  getDocumentIntakePort(): DocumentIntakePort {
    return this.documentIntakePort;
  }

  getOrchestratorPort(): CanonicalExecutionOrchestratorPort {
    return this.orchestratorPort;
  }

  async health(): Promise<EnterpriseRuntimeHealth> {
    const start = nowMs();
    const [intakeHealth, orchestratorHealth] = await Promise.all([
      this.documentIntakePort.health(),
      this.orchestratorPort.health(),
    ]);
    const end = nowMs();
    const ok = intakeHealth.ok && orchestratorHealth.ok;
    return {
      ok,
      runtimeId: this.runtimeId,
      latencyMs: Math.max(0, Math.round(end - start)),
      documentIntakeOk: intakeHealth.ok,
      orchestratorOk: orchestratorHealth.ok,
      message: ok
        ? "Enterprise Runtime pronto (DocumentIntake + Canonical Orchestrator)."
        : "Enterprise Runtime degradado — ver Ports.",
    };
  }

  /**
   * Integração ARCH-01: Captura upload → Orchestrator → DocumentIntakePort.
   *
   * 1. Orchestrator.startExecution — coordenação estrutural (sem Engines reais)
   * 2. DocumentIntakePort.createIntake — registro canônico com refs opacas
   */
  async registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult> {
    try {
      if (!input.sessionId || !input.documentId) {
        return {
          ok: false,
          message: "sessionId e documentId são obrigatórios.",
          code: "INVALID_INPUT",
        };
      }

      const correlationId = input.correlationId ?? undefined;
      const channel = input.channel ?? "capture-upload";

      // FASE 4 — passagem obrigatória pelo Canonical Execution Orchestrator (somente coordena).
      const execution = await this.orchestratorPort.startExecution({
        correlationId,
        tenantRef: input.tenantRef,
        channel,
        intakeRef: input.sessionId,
        documentRef: input.documentId,
        tags: ["arch-01", "capture", "document-intake"],
        customAttributes: {
          source: "capture-upload",
          sessionId: input.sessionId,
          documentId: input.documentId,
        },
        structuralNotes:
          "ARCH-01 bridge: capture upload registered via Enterprise Runtime (no OCR/IA execution).",
      });

      if (!execution.ok) {
        return {
          ok: false,
          execution,
          executionId: execution.context?.executionId,
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
        };
      }

      const intake = await this.documentIntakePort.createIntake({
        intake: {
          sourceType: "UPLOAD",
          priority: "NORMAL",
          documentIdentityReference: {
            documentId: input.documentId,
            kind: "capture-document",
          },
          storageReference: input.storagePath
            ? {
                key: input.storagePath,
                container: "clinical-documents",
                provider: "product-capture",
              }
            : undefined,
          metadataReference: {
            id: input.sessionId,
            kind: "capture-session",
            namespace: "product.capture",
          },
          tags: ["arch-01", "capture", channel],
          customAttributes: {
            sessionId: input.sessionId,
            documentId: input.documentId,
            tenantRef: input.tenantRef ?? null,
            correlationId: correlationId ?? null,
            executionId: execution.context?.executionId ?? null,
          },
          capabilities: ["capture-upload-bridge"],
        },
      });

      if (!intake.ok) {
        return {
          ok: false,
          intake,
          intakeId: intake.intakeId,
          execution,
          executionId: execution.context?.executionId,
          message: intake.message ?? "DocumentIntake createIntake falhou.",
          code: intake.code ?? "INTAKE_FAILED",
        };
      }

      return {
        ok: true,
        intakeId: intake.intakeId,
        executionId: execution.context?.executionId,
        intake,
        execution,
        message: "Capture document registered via Enterprise Runtime Ports.",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
      };
    }
  }
}
