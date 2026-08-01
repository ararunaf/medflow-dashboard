/**
 * ExecutionRequirementRegistryPort — contrato único do Registro Canônico de Requisitos (EPC-24 Sprint 12).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente as requisitos disponíveis.
 * NÃO valida requisitos. NÃO verifica pré-condições. NÃO acessa Engines.
 * Nenhuma operação invoca Rule Engine ou Decision Engine.
 */
import type {
  ExecutionRequirementRegistryPortCapabilities,
  ExecutionRequirementRegistryPortHealth,
  ExecutionRequirementRegistryProviderId,
  ExecutionRequirementStatisticsResult,
  FindRequirementsInput,
  FindRequirementsResult,
  GetRequirementInput,
  GetRequirementResult,
  ListRequirementsInput,
  ListRequirementsResult,
  RegisterRequirementInput,
  RegisterRequirementResult,
} from "./types";

export interface ExecutionRequirementRegistryPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionRequirementRegistryProviderId;

  /** Registra estruturalmente uma requisito no catálogo in-memory. */
  registerRequirement(input: RegisterRequirementInput): Promise<RegisterRequirementResult>;

  /** Obtém estruturalmente uma requisito registrada. */
  getRequirement(input: GetRequirementInput): Promise<GetRequirementResult>;

  /** Lista estruturalmente requisitos registradas. */
  listRequirements(input?: ListRequirementsInput): Promise<ListRequirementsResult>;

  /** Busca estruturalmente requisitos por filtro. */
  findRequirements(input: FindRequirementsInput): Promise<FindRequirementsResult>;

  /** Estatísticas estruturais do catálogo in-memory. */
  statistics(): Promise<ExecutionRequirementStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o registry). */
  health(): Promise<ExecutionRequirementRegistryPortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionRequirementRegistryPortCapabilities;
}
