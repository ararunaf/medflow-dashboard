/**
 * Tipos do Enterprise Runtime — ARCH-01.
 *
 * Runtime é o ponto único de acesso do produto à Enterprise Foundation.
 * Sem regras de negócio. Sem OCR/IA/XML/TISS reais. Sem filas/workers reais.
 */
import type { CanonicalExecutionOrchestratorPort } from "../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { DocumentIntakePort } from "../document-intake/ports/document-intake-port";
import type { CreateIntakeResult } from "../document-intake/ports/types";
import type { StartExecutionResult } from "../canonical-execution-orchestrator/ports/types";

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
};

/**
 * Entrada estrutural para registrar um upload de Captura como Document Intake.
 * Apenas referências opacas — sem interpretação clínica/OCR/TISS.
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
};

/**
 * Enterprise Runtime — composição e acesso oficial à Foundation.
 *
 * Responsabilidades:
 * - resolver Providers / Ports
 * - disponibilizar Adapters via factories
 * - inicializar Canonical Execution Orchestrator
 * - expor bridge estrutural para o produto
 *
 * NÃO contém regras de negócio.
 */
export interface EnterpriseRuntime {
  readonly runtimeId: EnterpriseRuntimeId;

  /** Resolve DocumentIntakePort (EPC-12). */
  getDocumentIntakePort(): DocumentIntakePort;

  /** Resolve CanonicalExecutionOrchestratorPort (EPC-24). */
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;

  /**
   * Bridge oficial Captura → Foundation.
   *
   * Fluxo:
   *   Produto → Runtime → Orchestrator (coordena) → DocumentIntakePort → Adapter
   *
   * Best-effort: nunca lança para o produto; falhas retornam ok:false.
   */
  registerCaptureDocumentIntake(
    input: RegisterCaptureDocumentIntakeInput,
  ): Promise<RegisterCaptureDocumentIntakeResult>;

  /** Health agregado dos Ports resolvidos. */
  health(): Promise<EnterpriseRuntimeHealth>;
}
