/**
 * ExecutionResourceRegistryPort — contrato único do Registro Canônico de Recursos (EPC-24 Sprint 13).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente os recursos disponíveis.
 * NÃO aloca recursos. NÃO reserva recursos. NÃO acessa Engines.
 * Nenhuma operação invoca Resource Allocation ou Load Balancing.
 */
import type {
  ExecutionResourceRegistryPortCapabilities,
  ExecutionResourceRegistryPortHealth,
  ExecutionResourceRegistryProviderId,
  ExecutionResourceStatisticsResult,
  FindResourcesInput,
  FindResourcesResult,
  GetResourceInput,
  GetResourceResult,
  ListResourcesInput,
  ListResourcesResult,
  RegisterResourceInput,
  RegisterResourceResult,
} from "./types";

export interface ExecutionResourceRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionResourceRegistryProviderId;

  /** Registra estruturalmente um recurso no catálogo in-memory. */
  registerResource(input: RegisterResourceInput): Promise<RegisterResourceResult>;

  /** Obtém estruturalmente um recurso registrada. */
  getResource(input: GetResourceInput): Promise<GetResourceResult>;

  /** Lista estruturalmente recursos registrados. */
  listResources(input?: ListResourcesInput): Promise<ListResourcesResult>;

  /** Busca estruturalmente recursos por filtro. */
  findResources(input: FindResourcesInput): Promise<FindResourcesResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionResourceStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionResourceRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionResourceRegistryPortCapabilities;
}
