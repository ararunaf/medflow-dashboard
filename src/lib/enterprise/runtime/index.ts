/**
 * Enterprise Runtime — ARCH-01 / DIP-01 / DIP-02 / DIP-03 / DIP-04 Integration.
 *
 * Ponto único de acesso da aplicação à Enterprise Foundation.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação
 *     → OCRRuntimePort → Orchestrator → OCR Provider Adapter (estrutural)
 *     → DocumentClassificationRuntimePort → Orchestrator
 *     → Classification Provider Adapter (referência estrutural)
 *
 * Sem regras de negócio. Sem OCR/IA/XML/TISS/classificação reais. Sem filas/workers reais.
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
