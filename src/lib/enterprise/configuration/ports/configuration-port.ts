/**
 * ConfigurationPort — contrato único de configuração (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, env, remote ou banco ficam nos adapters.
 *
 * EPC-03: fundação arquitetural genérica.
 * NÃO conhece cooperativas, operadoras, contratos, workflows, OCR ou IA.
 */
import type {
  ConfigurationCapabilities,
  ConfigurationExistsInput,
  ConfigurationExistsResult,
  ConfigurationGetInput,
  ConfigurationGetResult,
  ConfigurationHealth,
  ConfigurationListInput,
  ConfigurationListResult,
  ConfigurationProviderId,
  ConfigurationRemoveInput,
  ConfigurationRemoveResult,
  ConfigurationSetInput,
  ConfigurationSetResult,
} from "./types";

export interface ConfigurationPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ConfigurationProviderId;

  /** Verificação leve de prontidão (sem alterar configurações). */
  health(): Promise<ConfigurationHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ConfigurationCapabilities;

  /** Obtém um valor de configuração pela chave lógica. */
  get(input: ConfigurationGetInput): Promise<ConfigurationGetResult>;

  /** Define / atualiza um valor de configuração. */
  set(input: ConfigurationSetInput): Promise<ConfigurationSetResult>;

  /** Verifica existência de uma chave. */
  exists(input: ConfigurationExistsInput): Promise<ConfigurationExistsResult>;

  /** Remove uma chave. */
  remove(input: ConfigurationRemoveInput): Promise<ConfigurationRemoveResult>;

  /** Lista entradas (opcionalmente filtradas por prefixo/escopo). */
  list(input?: ConfigurationListInput): Promise<ConfigurationListResult>;
}
