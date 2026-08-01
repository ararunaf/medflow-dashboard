/**
 * WorkflowPort — contrato único de workflow (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, persistence ou banco ficam nos adapters.
 *
 * EPC-05: fundação arquitetural genérica.
 * NÃO conhece Paciente, Guia, Operadora, Contrato, Financeiro,
 * TISS, OCR, IA, Authorization, Auditoria ou Rule Engine.
 *
 * Papel exclusivo: orquestrar estados e transições.
 */
import type {
  AdvanceWorkflowInput,
  AdvanceWorkflowResult,
  CancelWorkflowInput,
  CancelWorkflowResult,
  GetStateInput,
  GetStateResult,
  GetWorkflowInput,
  GetWorkflowResult,
  ListWorkflowsInput,
  ListWorkflowsResult,
  RegisterWorkflowInput,
  RegisterWorkflowResult,
  RollbackWorkflowInput,
  RollbackWorkflowResult,
  StartWorkflowInput,
  StartWorkflowResult,
  WorkflowCapabilities,
  WorkflowHealth,
  WorkflowProviderId,
} from "./types";

export interface WorkflowPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: WorkflowProviderId;

  /** Verificação leve de prontidão (sem alterar estados). */
  health(): Promise<WorkflowHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): WorkflowCapabilities;

  /** Registra / atualiza uma definição de Workflow genérica. */
  registerWorkflow(input: RegisterWorkflowInput): Promise<RegisterWorkflowResult>;

  /** Obtém um Workflow por id ou nome/namespace. */
  getWorkflow(input: GetWorkflowInput): Promise<GetWorkflowResult>;

  /** Lista Workflows (filtros estruturais opcionais). */
  listWorkflows(input?: ListWorkflowsInput): Promise<ListWorkflowsResult>;

  /** Inicia uma instância (State) no Stage inicial. */
  start(input: StartWorkflowInput): Promise<StartWorkflowResult>;

  /** Avança uma instância por Transition (estrutural). */
  advance(input: AdvanceWorkflowInput): Promise<AdvanceWorkflowResult>;

  /** Reverte para um Checkpoint. */
  rollback(input: RollbackWorkflowInput): Promise<RollbackWorkflowResult>;

  /** Cancela uma instância em execução. */
  cancel(input: CancelWorkflowInput): Promise<CancelWorkflowResult>;

  /** Obtém o State atual de uma instância. */
  getState(input: GetStateInput): Promise<GetStateResult>;
}
