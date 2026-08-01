/**
 * TenantAssignmentPort — contrato único de Assignment Objects (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-10B: objetos canônicos de associação.
 * NÃO conhece usuários, autenticação, RBAC, permissões, contratos,
 * operadoras, regras clínicas, TISS, nem carrega Rule Packs / AI /
 * Storage / Configuration / Document Identity / Workflow.
 *
 * Assignment representa uma ASSOCIAÇÃO CANÔNICA — nunca configuração,
 * regra ou vínculo operacional.
 */
import type {
  CreateAssignmentInput,
  CreateAssignmentResult,
  GetAssignmentInput,
  GetAssignmentResult,
  ListAssignmentsInput,
  ListAssignmentsResult,
  TenantAssignmentCapabilities,
  TenantAssignmentHealth,
  TenantAssignmentProviderId,
} from "./types";

export interface TenantAssignmentPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: TenantAssignmentProviderId;

  /** Verificação leve de prontidão (sem alterar assignments). */
  health(): Promise<TenantAssignmentHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TenantAssignmentCapabilities;

  /** Cria / registra um Assignment canônico. */
  createAssignment(input: CreateAssignmentInput): Promise<CreateAssignmentResult>;

  /** Obtém um Assignment por AssignmentId. */
  getAssignment(input: GetAssignmentInput): Promise<GetAssignmentResult>;

  /** Lista Assignments (filtros estruturais opcionais). */
  listAssignments(input?: ListAssignmentsInput): Promise<ListAssignmentsResult>;
}
