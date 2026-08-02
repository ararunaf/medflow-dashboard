/**
 * DefaultEnterpriseRuntime — composição oficial da Foundation
 * (ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 / DIP-05).
 *
 * Ponto único de acesso do produto aos Ports Enterprise.
 * Bridge Captura → CaptureEngineRuntimePort → Orchestrator → DocumentIntakeRuntime
 *   → DocumentIntakePort → Adapter → Implementação existente
 *   → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *   → DocumentClassificationRuntimePort → Orchestrator
 *   → Classification Provider Adapter (referência estrutural)
 *   → StorageManagerRuntimePort → Orchestrator
 *   → Storage Provider Adapter (referência estrutural).
 * Não executa OCR real, classificação real, storage real, IA, parser, TISS, filas ou workers reais.
 */
import { createCanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/providers/create-canonical-execution-orchestrator-port";
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import { createCaptureEngineRuntimePort } from "../capture-engine-runtime/providers/create-capture-engine-runtime-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { CanonicalCaptureRequest } from "../capture-engine-runtime/ports/models";
import { createDocumentClassificationRuntimePort } from "../document-classification-runtime/providers/create-document-classification-runtime-port";
import type { DocumentClassificationRuntimePort } from "../document-classification-runtime/ports/document-classification-runtime-port";
import { createDocumentIntakePort } from "../document-intake/providers/create-document-intake-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import { createDocumentIntakeRuntimePort } from "../document-intake-runtime/providers/create-document-intake-runtime-port";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import { createOCRProviderPort } from "../ocr-provider/providers/create-ocr-provider-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import { createOCRRuntimePort } from "../ocr-runtime/providers/create-ocr-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
import { createStorageManagerRuntimePort } from "../storage-manager-runtime/providers/create-storage-manager-runtime-port";
import type { StorageManagerRuntimePort } from "../storage-manager-runtime/ports/storage-manager-runtime-port";
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
  private readonly documentClassificationRuntimePort: DocumentClassificationRuntimePort;
  private readonly storageManagerRuntimePort: StorageManagerRuntimePort;
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
    this.documentClassificationRuntimePort =
      options.documentClassificationRuntimePort ??
      createDocumentClassificationRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getOCRRuntimePort: () => this.ocrRuntimePort,
        },
      });
    this.storageManagerRuntimePort =
      options.storageManagerRuntimePort ??
      createStorageManagerRuntimePort({
        provider: "default",
        enterpriseDeps: {
          getOrchestratorPort: () => this.orchestratorPort,
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
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
          getDocumentClassificationRuntimePort: () => this.documentClassificationRuntimePort,
          getStorageManagerRuntimePort: () => this.storageManagerRuntimePort,
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

  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort {
    return this.documentClassificationRuntimePort;
  }

  getStorageManagerRuntimePort(): StorageManagerRuntimePort {
    return this.storageManagerRuntimePort;
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
      classificationRuntimeHealth,
      storageManagerRuntimeHealth,
    ] = await Promise.all([
      this.documentIntakePort.health(),
      this.orchestratorPort.health(),
      this.documentIntakeRuntimePort.health(),
      this.captureEngineRuntimePort.health(),
      this.ocrRuntimePort.health(),
      this.ocrProviderPort.health(),
      this.documentClassificationRuntimePort.health(),
      this.storageManagerRuntimePort.health(),
    ]);
    const end = nowMs();
    const ok =
      intakeHealth.ok &&
      orchestratorHealth.ok &&
      intakeRuntimeHealth.ok &&
      captureRuntimeHealth.ok &&
      ocrRuntimeHealth.ok &&
      ocrProviderHealth.ok &&
      classificationRuntimeHealth.ok &&
      storageManagerRuntimeHealth.ok;
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
      documentClassificationRuntimeOk: classificationRuntimeHealth.ok,
      storageManagerRuntimeOk: storageManagerRuntimeHealth.ok,
      message: ok
        ? "Enterprise Runtime pronto (StorageManagerRuntime + DocumentClassificationRuntime + OCRRuntime + CaptureEngineRuntime + DocumentIntakeRuntime + Orchestrator + DocumentIntake)."
        : "Enterprise Runtime degradado — ver Ports.",
    };
  }

  /**
   * Integração ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 / DIP-05:
   * Captura upload → Capture Engine Runtime → OCR Runtime → Classification Runtime
   * → Storage Manager Runtime.
   *
   * Produto → Runtime → CaptureEngineRuntimePort
   *   → Orchestrator.startExecution → DocumentIntakeRuntime.registerIntake
   *   → DocumentIntakePort.createIntake
   *   → OCRRuntimePort.coordinateOcr (estrutural — sem OCR real)
   *   → DocumentClassificationRuntimePort.coordinateClassification (estrutural — sem classificação real)
   *   → StorageManagerRuntimePort.coordinateStorage (estrutural — sem armazenamento real)
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
          tags: ["arch-01", "dip-01", "dip-02", "dip-03", "dip-04", "dip-05", "capture", channel],
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
            "document-classification-runtime",
            "storage-manager-runtime",
          ],
        },
        configuration: {
          kind: "canonical-capture-configuration",
          sourceType: "UPLOAD",
          channel,
          priority: "NORMAL",
          notes:
            "DIP-05 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime (no real processing/storage).",
        },
        structuralNotes:
          "DIP-05 bridge: capture upload registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime (no real processing/storage).",
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
          classificationRuntimeSessionId: result.classificationRuntimeSessionId,
          classificationExecutionId: result.classificationExecutionId,
          storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
          storageExecutionId: result.storageExecutionId,
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
        classificationRuntimeSessionId: result.classificationRuntimeSessionId,
        classificationExecutionId: result.classificationExecutionId,
        storageManagerRuntimeSessionId: result.storageManagerRuntimeSessionId,
        storageExecutionId: result.storageExecutionId,
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
          "Capture document registered via Capture Engine Runtime + OCR Runtime + Classification Runtime + Storage Manager Runtime (structural).",
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
