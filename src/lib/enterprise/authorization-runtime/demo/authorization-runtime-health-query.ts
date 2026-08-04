/**
 * PoC Application — depende apenas de AuthorizationRuntimePort (C-05).
 *
 * Não é usado por rotas, Server Functions, UI, autorização funcional,
 * elegibilidade, SOAP, XML, REST, operadoras ou banco.
 */
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
} from "../ports/types";

export type AuthorizationRuntimeHealthSummary = {
  health: AuthorizationRuntimeHealth;
  capabilities: AuthorizationRuntimeCapabilities;
  info: AuthorizationRuntimeInfo;
  architectureLayer: "application";
};

/**
 * Query de aplicação: resume saúde/capacidades/info via Port.
 * Zero conhecimento de autorização funcional / operadoras.
 */
export async function getAuthorizationRuntimeHealthSummary(
  port: AuthorizationRuntimePort,
): Promise<AuthorizationRuntimeHealthSummary> {
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
