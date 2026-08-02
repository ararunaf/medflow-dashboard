/**
 * Enterprise Runtime — ARCH-01 / DIP-01 / DIP-02 Enterprise Runtime Integration.
 *
 * Ponto único de acesso da aplicação à Enterprise Foundation.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação
 *
 * Sem regras de negócio. Sem OCR/IA/XML/TISS reais. Sem filas/workers reais.
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
