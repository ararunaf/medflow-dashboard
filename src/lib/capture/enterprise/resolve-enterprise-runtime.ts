/**
 * EPC-24A — Composition root oficial do Capture para a Enterprise Foundation.
 *
 * Único ponto de entrada autorizado:
 *   Capture → getEnterpriseRuntime() → Ports / Runtimes Enterprise
 *
 * Produto NÃO instancia Adapters Enterprise concretos fora deste caminho.
 * Sem regras de negócio. Sem cutover de pipeline. Sem mudança de comportamento.
 */
import { getEnterpriseRuntime, type EnterpriseRuntime } from "@/lib/enterprise/runtime";

/** Identificador canônico do entrypoint (documentação / auditoria). */
export const CAPTURE_ENTERPRISE_RUNTIME_ENTRY = "getEnterpriseRuntime" as const;

/**
 * Resolve o Enterprise Runtime compartilhado — único composition root do Capture.
 */
export function resolveCaptureEnterpriseRuntime(): EnterpriseRuntime {
  return getEnterpriseRuntime();
}
