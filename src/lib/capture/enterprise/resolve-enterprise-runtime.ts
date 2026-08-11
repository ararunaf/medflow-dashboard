/**
 * EPC-24A / EPC-24E — Composition root oficial do Capture para a Enterprise Foundation.
 *
 * Único ponto de entrada operacional autorizado:
 *   Capture → getEnterpriseRuntime() → Ports / Runtimes Enterprise
 *
 * Produto NÃO instancia Adapters Enterprise concretos fora deste caminho.
 * Produto NÃO executa engines legado diretamente — apenas via gateways
 * autorizados sob este composition root.
 *
 * Cutover EPC-24E: Dual Path AER-GA03-A1 eliminado.
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
