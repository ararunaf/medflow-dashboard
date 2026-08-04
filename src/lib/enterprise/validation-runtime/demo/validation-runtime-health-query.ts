/**
 * PoC Application — depende apenas de ValidationRuntimePort (F3-CAP-08).
 *
 * Não é usado por rotas, Server Functions, UI, OCR, IA, validação real,
 * Auditoria, Rule Engine, Workflow ou preenchimento de guias.
 */
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import type {
  ValidationRuntimeCapabilities,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
} from "../ports/types";

export type ValidationRuntimeHealthSummary = {
  health: ValidationRuntimeHealth;
  capabilities: ValidationRuntimeCapabilities;
  info: ValidationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de validação real / auditoria / IA / ML / LLM / TISS.
 */
export async function getValidationRuntimeHealthSummary(
  port: ValidationRuntimePort,
): Promise<ValidationRuntimeHealthSummary> {
  const health = await port.health();
  const capabilities = port.capabilities();
  const info = port.providerInfo();
  return {
    health,
    capabilities,
    info,
    architectureLayer: "application",
  };
}
