/**
 * ExecutionEnvironmentRegistryPort — contrato único do Registro Canônico de Ambientes (EPC-24 Sprint 14).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente os ambientes disponíveis.
 * NÃO seleciona ambientes. NÃO provisiona ambientes. NÃO acessa Engines.
 * Nenhuma operação invoca Environment Selection ou Environment Activation.
 */
import type {
  ExecutionEnvironmentRegistryPortCapabilities,
  ExecutionEnvironmentRegistryPortHealth,
  ExecutionEnvironmentRegistryProviderId,
  ExecutionEnvironmentStatisticsResult,
  FindEnvironmentsInput,
  FindEnvironmentsResult,
  GetEnvironmentInput,
  GetEnvironmentResult,
  ListEnvironmentsInput,
  ListEnvironmentsResult,
  RegisterEnvironmentInput,
  RegisterEnvironmentResult,
} from "./types";

export interface ExecutionEnvironmentRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionEnvironmentRegistryProviderId;

  /** Registra estruturalmente um ambiente no catálogo in-memory. */
  registerEnvironment(input: RegisterEnvironmentInput): Promise<RegisterEnvironmentResult>;

  /** Obtém estruturalmente um ambiente registrado. */
  getEnvironment(input: GetEnvironmentInput): Promise<GetEnvironmentResult>;

  /** Lista estruturalmente ambientes registrados. */
  listEnvironments(input?: ListEnvironmentsInput): Promise<ListEnvironmentsResult>;

  /** Busca estruturalmente ambientes por filtro. */
  findEnvironments(input: FindEnvironmentsInput): Promise<FindEnvironmentsResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionEnvironmentStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionEnvironmentRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionEnvironmentRegistryPortCapabilities;
}
