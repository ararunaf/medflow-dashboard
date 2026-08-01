/**
 * ExecutionRegistryPort — contrato único do Registro Canônico de Execuções (EPC-24 Sprint 06).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente o catálogo de execuções.
 * NÃO persiste em banco. NÃO usa Supabase. NÃO executa Engines.
 * Nenhuma operação acessa APIs externas.
 */
import type {
  ExecutionRegistryPortCapabilities,
  ExecutionRegistryPortHealth,
  ExecutionRegistryProviderId,
  ExecutionRegistryStatisticsResult,
  FindRegistryExecutionInput,
  FindRegistryExecutionResult,
  GetRegistryExecutionInput,
  GetRegistryExecutionResult,
  ListRegistryExecutionsInput,
  ListRegistryExecutionsResult,
  RegisterExecutionInput,
  RegisterExecutionResult,
  RemoveRegistryExecutionInput,
  RemoveRegistryExecutionResult,
} from "./types";

export interface ExecutionRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionRegistryProviderId;

  /** Registra estruturalmente uma execução no catálogo in-memory. */
  registerExecution(input: RegisterExecutionInput): Promise<RegisterExecutionResult>;

  /** Obtém estruturalmente uma execução registrada. */
  getExecution(input: GetRegistryExecutionInput): Promise<GetRegistryExecutionResult>;

  /** Lista estruturalmente execuções registradas. */
  listExecutions(input?: ListRegistryExecutionsInput): Promise<ListRegistryExecutionsResult>;

  /** Busca estruturalmente uma execução por query. */
  findExecution(input: FindRegistryExecutionInput): Promise<FindRegistryExecutionResult>;

  /** Remove estruturalmente uma execução do catálogo in-memory. */
  removeExecution(input: RemoveRegistryExecutionInput): Promise<RemoveRegistryExecutionResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionRegistryStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionRegistryPortCapabilities;
}
