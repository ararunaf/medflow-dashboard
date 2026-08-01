/**
 * ExecutionPolicyRegistryPort — contrato único do Registro Canônico de Políticas (EPC-24 Sprint 10).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente as políticas disponíveis.
 * NÃO interpreta políticas. NÃO aplica regras. NÃO acessa Engines.
 * Nenhuma operação invoca Rule Engine ou Decision Engine.
 */
import type {
  ExecutionPolicyRegistryPortCapabilities,
  ExecutionPolicyRegistryPortHealth,
  ExecutionPolicyRegistryProviderId,
  ExecutionPolicyStatisticsResult,
  FindPoliciesInput,
  FindPoliciesResult,
  GetPolicyInput,
  GetPolicyResult,
  ListPoliciesInput,
  ListPoliciesResult,
  RegisterPolicyInput,
  RegisterPolicyResult,
} from "./types";

export interface ExecutionPolicyRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionPolicyRegistryProviderId;

  /** Registra estruturalmente uma política no catálogo in-memory. */
  registerPolicy(input: RegisterPolicyInput): Promise<RegisterPolicyResult>;

  /** Obtém estruturalmente uma política registrada. */
  getPolicy(input: GetPolicyInput): Promise<GetPolicyResult>;

  /** Lista estruturalmente políticas registradas. */
  listPolicies(input?: ListPoliciesInput): Promise<ListPoliciesResult>;

  /** Busca estruturalmente políticas por filtro. */
  findPolicies(input: FindPoliciesInput): Promise<FindPoliciesResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionPolicyStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionPolicyRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionPolicyRegistryPortCapabilities;
}
