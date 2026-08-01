/**
 * ExecutionDependencyRegistryPort — contrato único do Registro Canônico de Dependências (EPC-24 Sprint 09).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente as dependências entre capacidades e componentes.
 * NÃO resolve dependências. NÃO ordena execução. NÃO calcula DAG.
 * Nenhuma operação acessa Engines.
 */
import type {
  ExecutionDependencyRegistryPortCapabilities,
  ExecutionDependencyRegistryPortHealth,
  ExecutionDependencyRegistryProviderId,
  ExecutionDependencyStatisticsResult,
  FindDependenciesInput,
  FindDependenciesResult,
  GetDependencyInput,
  GetDependencyResult,
  ListDependenciesInput,
  ListDependenciesResult,
  RegisterDependencyInput,
  RegisterDependencyResult,
} from "./types";

export interface ExecutionDependencyRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionDependencyRegistryProviderId;

  /** Registra estruturalmente uma dependência no catálogo in-memory. */
  registerDependency(input: RegisterDependencyInput): Promise<RegisterDependencyResult>;

  /** Obtém estruturalmente uma dependência registrada. */
  getDependency(input: GetDependencyInput): Promise<GetDependencyResult>;

  /** Lista estruturalmente dependências registradas. */
  listDependencies(input?: ListDependenciesInput): Promise<ListDependenciesResult>;

  /** Busca estruturalmente dependências por filtro. */
  findDependencies(input: FindDependenciesInput): Promise<FindDependenciesResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionDependencyStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionDependencyRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionDependencyRegistryPortCapabilities;
}
