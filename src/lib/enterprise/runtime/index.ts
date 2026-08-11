/**
 * Enterprise Runtime — ARCH-01 / DIP-01…DIP-06 / ARCH-02 (DIP-07) Integration.
 *
 * Ponto único de acesso da aplicação à Enterprise Foundation.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação
 *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *     → DocumentClassificationRuntimePort → Orchestrator
 *     → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter (CLASS-01)
 *     → StorageManagerRuntimePort → Orchestrator
 *     → Storage Provider Adapter (referência estrutural)
 *     → DocumentSearchRuntimePort → Orchestrator
 *     → Search Provider Adapter (referência estrutural)
 *     → AIProviderRuntimePort → Orchestrator → AIProviderPort → Adapter → OpenAI
 *
 * Sem regras de negócio. Sem OCR/XML/TISS/classificação/storage/busca reais. Sem filas/workers reais.
 * IA: exclusivamente via AI Provider Runtime (ARCH-02).
 * Classification: exclusivamente via DocumentClassificationProviderPort (CLASS-01).
 */
export type {
  EnterpriseRuntime,
  EnterpriseRuntimeHealth,
  EnterpriseRuntimeId,
  EnterpriseRuntimeOptions,
  RegisterCaptureDocumentIntakeInput,
  RegisterCaptureDocumentIntakeResult,
} from "./types";

export { DefaultEnterpriseRuntime } from "./enterprise-runtime";

export {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "./create-enterprise-runtime";

export {
  registerTissReceivedJob,
  type RegisterTissReceivedJobInput,
  type RegisterTissReceivedJobResult,
  type TissReceivedJob,
} from "./register-tiss-received-job";

export {
  processTissReceivedOcr,
  TISS_JOB_STATUS_OCR_COMPLETED,
  ENTERPRISE_TISS_QUEUE_NAME,
  type ProcessTissReceivedOcrInput,
  type ProcessTissReceivedOcrResult,
  type TissOcrCompletedJob,
} from "./process-tiss-received-ocr";
