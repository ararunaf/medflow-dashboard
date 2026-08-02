/**
 * Tipos do Enterprise Runtime — ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 / DIP-05.
 *
 * Runtime é o ponto único de acesso do produto à Enterprise Foundation.
 * Sem regras de negócio. Sem OCR/IA/XML/TISS/classificação/storage reais. Sem filas/workers reais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { CaptureEngineRuntimePort } from "../capture-engine-runtime/ports/capture-engine-runtime-port";
import type { DocumentClassificationRuntimePort } from "../document-classification-runtime/ports/document-classification-runtime-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import type { CreateIntakeResult } from "../document-intake/ports/types";
import type { StartExecutionResult } from "../canonical-execution-orchestrator/ports/types";
import type { DocumentIntakeRuntimePort } from "../document-intake-runtime/ports/document-intake-runtime-port";
import type { OCRRuntimePort } from "../ocr-runtime/ports/ocr-runtime-port";
import type { OCRProviderPort } from "../ocr-provider/ports/ocr-provider-port";
import type { StorageManagerRuntimePort } from "../storage-manager-runtime/ports/storage-manager-runtime-port";

/** Identificador estável do runtime. */
export type EnterpriseRuntimeId = "default" | "test";

/** Saúde agregada do runtime (Ports resolvidos). */
export type EnterpriseRuntimeHealth = {
  ok: boolean;
  runtimeId: EnterpriseRuntimeId;
  latencyMs?: number;
  message?: string;
  documentIntakeOk: boolean;
  orchestratorOk: boolean;
  documentIntakeRuntimeOk?: boolean;
  captureEngineRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  ocrProviderOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  storageManagerRuntimeOk?: boolean;
};

/**
 * Entrada estrutural para registrar um upload de Captura como Document Intake.
 * Apenas referências opacas — sem interpretação clínica/OCR/TISS/classificação/storage.
 */
export type RegisterCaptureDocumentIntakeInput = {
  sessionId: string;
  documentId: string;
  storagePath?: string;
  tenantRef?: string;
  correlationId?: string | null;
  channel?: string;
};

/** Resultado estrutural do bridge Captura → Enterprise. */
export type RegisterCaptureDocumentIntakeResult = {
  ok: boolean;
  intakeId?: string;
  executionId?: string;
  runtimeSessionId?: string;
  /** DIP-03 — sessão OCR Runtime (coordenação estrutural, sem OCR real). */
  ocrRuntimeSessionId?: string;
  ocrExecutionId?: string;
  /** DIP-04 — sessão Classification Runtime (coordenação estrutural, sem classificação real). */
  classificationRuntimeSessionId?: string;
  classificationExecutionId?: string;
  /** DIP-05 — sessão Storage Manager Runtime (coordenação estrutural, sem armazenamento real). */
  storageManagerRuntimeSessionId?: string;
  storageExecutionId?: string;
  intake?: CreateIntakeResult;
  execution?: StartExecutionResult;
  message?: string;
  code?: string;
};

/** Opções de criação do Enterprise Runtime. */
export type EnterpriseRuntimeOptions = {
  runtimeId?: EnterpriseRuntimeId;
  /**
   * Ports pré-resolvidos (testes / DI).
   * Em produção o Runtime resolve via factories oficiais.
   */
  documentIntakePort?: DocumentIntakePort;
  orchestratorPort?: CanonicalExecutionOrchestratorPort;
  documentIntakeRuntimePort?: DocumentIntakeRuntimePort;
  captureEngineRuntimePort?: CaptureEngineRuntimePort;
  ocrRuntimePort?: OCRRuntimePort;
  ocrProviderPort?: OCRProviderPort;
  documentClassificationRuntimePort?: DocumentClassificationRuntimePort;
  storageManagerRuntimePort?: StorageManagerRuntimePort;
};

/**
 * Enterprise Runtime — composição e acesso oficial à Foundation.
 *
 * Responsabilidades:
 * - resolver Providers / Ports
 * - disponibilizar Adapters via factories
 * - inicializar Canonical Execution Orchestrator
 * - expor Document Intake Runtime (DIP-01)
 * - expor Capture Engine Runtime (DIP-02)
 * - expor OCR Runtime (DIP-03)
 * - expor Document Classification Runtime (DIP-04)
 * - expor Storage Manager Runtime (DIP-05)
 * - expor bridge estrutural para o produto
 *
 * NÃO contém regras de negócio. NÃO executa OCR/classificação/storage reais.
 */
export interface EnterpriseRuntime {
  readonly runtimeId: EnterpriseRuntimeId;

  /** Resolve DocumentIntakePort (EPC-12). */
  getDocumentIntakePort(): DocumentIntakePort;

  /** Resolve CanonicalExecutionOrchestratorPort (EPC-24). */
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;

  /** Resolve DocumentIntakeRuntimePort (DIP-01). */
  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort;

  /** Resolve CaptureEngineRuntimePort (DIP-02). */
  getCaptureEngineRuntimePort(): CaptureEngineRuntimePort;

  /** Resolve OCRRuntimePort (DIP-03). */
  getOCRRuntimePort(): OCRRuntimePort;

  /** Resolve DocumentClassificationRuntimePort (DIP-04). */
  getDocumentClassificationRuntimePort(): DocumentClassificationRuntimePort;

  /** Resolve StorageManagerRuntimePort (DIP-05). */
  getStorageManagerRuntimePort(): StorageManagerRuntimePort;

  /**
   * Bridge oficial Captura → Foundation (DIP-02 / DIP-03 / DIP-04 / DIP-05).
   *
   * Fluxo:
   *   Produto → Runtime → CaptureEngineRuntimePort
   *     → Orchestrator → DocumentIntakeRuntime → DocumentIntakePort → Adapter
   *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
   *     → DocumentClassificationRuntimePort → Orchestrator
   *     → Classification Provider Adapter (referência estrutural)
   *     → StorageManagerRuntimePort → Orchestrator
   *     → Storage Provider Adapter (referência estrutural)
   *
   * Best-effort: nunca lança para o produto; falhas retornam ok:false.
   */
  registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult>;

  /** Health agregado dos Ports resolvidos. */
  health(): Promise<EnterpriseRuntimeHealth>;
}
