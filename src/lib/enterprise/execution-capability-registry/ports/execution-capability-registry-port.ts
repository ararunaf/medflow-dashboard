/**
 * ExecutionCapabilityRegistryPort — contrato único do Registro Canônico de Capacidades (EPC-24 Sprint 08).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente as capacidades disponíveis.
 * NÃO executa capacidades. NÃO usa descoberta automática. NÃO usa reflexão.
 * NÃO usa plugins. NÃO usa carregamento dinâmico. Nenhuma operação acessa Engines.
 */
import type {
  ExecutionCapabilityRegistryPortCapabilities,
  ExecutionCapabilityRegistryPortHealth,
  ExecutionCapabilityRegistryProviderId,
  ExecutionCapabilityStatisticsResult,
  FindCapabilitiesInput,
  FindCapabilitiesResult,
  GetCapabilityInput,
  GetCapabilityResult,
  ListCapabilitiesInput,
  ListCapabilitiesResult,
  RegisterCapabilityInput,
  RegisterCapabilityResult,
} from "./types";

export interface ExecutionCapabilityRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionCapabilityRegistryProviderId;

  /** Registra estruturalmente uma capacidade no catálogo in-memory. */
  registerCapability(input: RegisterCapabilityInput): Promise<RegisterCapabilityResult>;

  /** Obtém estruturalmente uma capacidade registrada. */
  getCapability(input: GetCapabilityInput): Promise<GetCapabilityResult>;

  /** Lista estruturalmente capacidades registradas. */
  listCapabilities(input?: ListCapabilitiesInput): Promise<ListCapabilitiesResult>;

  /** Busca estruturalmente capacidades por filtro. */
  findCapabilities(input: FindCapabilitiesInput): Promise<FindCapabilitiesResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionCapabilityStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionCapabilityRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionCapabilityRegistryPortCapabilities;
}
