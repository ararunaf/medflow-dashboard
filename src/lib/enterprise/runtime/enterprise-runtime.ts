/**
 * DefaultEnterpriseRuntime — composição oficial da Foundation
 * (ARCH-01 / DIP-01 / DIP-02 / DIP-03).
 *
 * Ponto único de acesso do produto aos Ports Enterprise.
 * Bridge Captura → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime
 *   → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural).
 * Não executa OCR real, IA, parser, TISS, filas ou workers reais.
 */
import { createCanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import { createCaptureEngineRuntimePort } from "../capture-engine-runtime/providers/create-capture-engine-runtime-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { CanonicalCaptureRequest } from "../capture-engine-runtime/ports/models";
import { createDocumentIntakePort } from "../document-intake/providers/create-document-intake-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import { createDocumentIntakeRuntimePort } from "../document-intake-runtime/providers/create-document-intake-runtime-port";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import { createOCRProviderPort } from "../ocr-provider/providers/create-ocr-provider-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import { createOCRRuntimePort } from "../ocr-runtime/providers/create-ocr-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
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
  private readonly documentIntakeRuntimePort: DocumentIntakeRuntimePort;
  private readonly ocrProviderPort: OCRProviderPort;
  private readonly ocrRuntimePort: OCRRuntimePort;
  private readonly captureEngineRuntimePort: CaptureEngineRuntimePort;

  constructor(options: EnterpriseRuntimeOptions = {}) {
    this.runtimeId = options.runtimeId ?? "default";
    this.documentIntakePort =
      options.documentIntakePort ?? createDocumentIntakePort({ provider: "default" });
    this.orchestratorPort =
      options.orchestratorPort ?? createCanonicalExecutionOrchestratorPort({ provider: "default" });
    this.documentIntakeRuntimePort =
      options.documentIntakeRuntimePort ??
      createDocumentIntakeRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getDocumentIntakePort: () => this.documentIntakePort,
          getOrchestratorPort: () => this.orchestratorPort,
        },
      });
    this.ocrProviderPort =
      options.ocrProviderPort ?? createOCRProviderPort({ provider: "default" });
    this.ocrRuntimePort =
      options.ocrRuntimePort ??
      createOCRRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRProviderPort: () => this.ocrProviderPort,
        },
      });
    this.captureEngineRuntimePort =
      options.captureEngineRuntimePort ??
      createCaptureEngineRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentIntakeRuntimePort: () => this.documentIntakeRuntimePort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
        },
      });
  }

  getDocumentIntakePort(): DocumentIntakePort {
    return this.documentIntakePort;
  }

  getOrchestratorPort(): CanonicalExecutionOrchestratorPort {
    return this.orchestratorPort;
  }

  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort {
    return this.documentIntakeRuntimePort;
  }

  getCaptureEngineRuntimePort(): CaptureEngineRuntimePort {
    return this.captureEngineRuntimePort;
  }

  getOCRRuntimePort(): OCRRuntimePort {
    return this.ocrRuntimePort;
  }

  async health(): Promise<EnterpriseRuntimeHealth> {
    const start = nowMs();
    const [
      intakeHealth,
      orchestratorHealth,
      intakeRuntimeHealth,
      captureRuntimeHealth,
      ocrRuntimeHealth,
      ocrProviderHealth,
    ] = await Promise.all([
      this.documentIntakePort.health(),
      this.orchestratorPort.health(),
      this.documentIntakeRuntimePort.health(),
      this.captureEngineRuntimePort.health(),
      this.ocrRuntimePort.health(),
      this.ocrProviderPort.health(),
    ]);
    const end = nowMs();
    const ok =
      intakeHealth.ok &&
      orchestratorHealth.ok &&
      intakeRuntimeHealth.ok &&
      captureRuntimeHealth.ok &&
      ocrRuntimeHealth.ok &&
      ocrProviderHealth.ok;
    return {
      ok,
      runtimeId: this.runtimeId,
      latencyMs: Math.max(0, Math.round(end - start)),
      documentIntakeOk: intakeHealth.ok,
      orchestratorOk: orchestratorHealth.ok,
      documentIntakeRuntimeOk: intakeRuntimeHealth.ok,
      captureEngineRuntimeOk: captureRuntimeHealth.ok,
      ocrRuntimeOk: ocrRuntimeHealth.ok,
      ocrProviderOk: ocrProviderHealth.ok,
      message: ok
        ? "Enterprise Runtime pronto (OCRRuntime + CaptureEngineRuntime + DocumentIntakeRuntime + Orchestrator + DocumentIntake)."
        : "Enterprise Runtime degradado — ver Ports.",
    };
  }

  /**
   * Integração ARCH-01 / DIP-01 / DIP-02 / DIP-03: Captura upload → Capture Engine Runtime → OCR Runtime.
   *
   * Produto → Runtime → CaptureEngineRuntimePort
   *   → Orchestrator.startExecution → DocumentIntakeRuntime.registerIntake
   *   → DocumentIntakePort.createIntake
   *   → OCRRuntimePort.coordinateOcr (estrutural — sem OCR real)
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

      const request: CanonicalCaptureRequest = {
        kind: "canonical-capture-request",
        identity: {
          kind: "canonical-capture-identity",
          documentId: input.documentId,
          documentKind: "capture-document",
        },
        metadata: {
          kind: "canonical-capture-metadata",
          sessionId: input.sessionId,
          tenantRef: input.tenantRef,
          correlationId,
          channel,
          tags: ["arch-01", "dip-01", "dip-02", "dip-03", "capture", channel],
          customAttributes: {
            source: "capture-upload",
            sessionId: input.sessionId,
            documentId: input.documentId,
          },
        },
        reference: {
          kind: "canonical-capture-reference",
          storageKey: input.storagePath,
          storageContainer: "clinical-documents",
          storageProvider: "product-capture",
          metadataId: input.sessionId,
          metadataNamespace: "product.capture",
        },
        capabilities: {
          kind: "canonical-capture-capabilities",
          declared: [
            "capture-upload-bridge",
            "capture-engine-runtime",
            "document-intake-runtime",
            "ocr-runtime",
          ],
        },
        configuration: {
          kind: "canonical-capture-configuration",
          sourceType: "UPLOAD",
          channel,
          priority: "NORMAL",
          notes:
            "DIP-03 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime (no real OCR).",
        },
        structuralNotes:
          "DIP-03 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime (no real OCR).",
      };

      const result = await this.captureEngineRuntimePort.registerCapture(request);

      if (!result.ok) {
        return {
          ok: false,
          intakeId: result.intakeId,
          executionId: result.executionId,
          runtimeSessionId: result.runtimeSessionId,
          ocrRuntimeSessionId: result.ocrRuntimeSessionId,
          ocrExecutionId: result.ocrExecutionId,
          message: result.message ?? "Capture Engine Runtime falhou.",
          code: result.code ?? "CAPTURE_RUNTIME_FAILED",
        };
      }

      // Rehidrata resultados dos Ports oficiais para compatibilidade ARCH-01 / DIP-01.
      const intake =
        result.intakeId != null
          ? await this.documentIntakePort.getIntake({ intakeId: result.intakeId })
          : undefined;
      const execution =
        result.executionId != null
          ? await this.orchestratorPort.getExecution({ executionId: result.executionId })
          : undefined;

      return {
        ok: true,
        intakeId: result.intakeId,
        executionId: result.executionId,
        runtimeSessionId: result.runtimeSessionId,
        ocrRuntimeSessionId: result.ocrRuntimeSessionId,
        ocrExecutionId: result.ocrExecutionId,
        intake: intake
          ? {
              ok: intake.ok,
              intakeId: result.intakeId!,
              intake: intake.intake,
              message: intake.message,
              code: intake.code,
            }
          : undefined,
        execution: execution,
        message:
          result.message ??
          "Capture document registered via Capture Engine Runtime + OCR Runtime (structural).",
        code: result.code,
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
