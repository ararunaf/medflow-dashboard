/**
 * ExecutionConstraintRegistryPort — contrato único do Registro Canônico de Restrições (EPC-24 Sprint 11).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente as restrições disponíveis.
 * NÃO interpreta restrições. NÃO aplica regras. NÃO acessa Engines.
 * Nenhuma operação invoca Rule Engine ou Decision Engine.
 */
import type {
  ExecutionConstraintRegistryPortCapabilities,
  ExecutionConstraintRegistryPortHealth,
  ExecutionConstraintRegistryProviderId,
  ExecutionConstraintStatisticsResult,
  FindConstraintsInput,
  FindConstraintsResult,
  GetConstraintInput,
  GetConstraintResult,
  ListConstraintsInput,
  ListConstraintsResult,
  RegisterConstraintInput,
  RegisterConstraintResult,
} from "./types";

export interface ExecutionConstraintRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionConstraintRegistryProviderId;

  /** Registra estruturalmente uma restrição no catálogo in-memory. */
  registerConstraint(input: RegisterConstraintInput): Promise<RegisterConstraintResult>;

  /** Obtém estruturalmente uma restrição registrada. */
  getConstraint(input: GetConstraintInput): Promise<GetConstraintResult>;

  /** Lista estruturalmente restrições registradas. */
  listConstraints(input?: ListConstraintsInput): Promise<ListConstraintsResult>;

  /** Busca estruturalmente restrições por filtro. */
  findConstraints(input: FindConstraintsInput): Promise<FindConstraintsResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionConstraintStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionConstraintRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionConstraintRegistryPortCapabilities;
}
