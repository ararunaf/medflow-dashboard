/**
 * ExecutionStateMachinePort — contrato único da Máquina Canônica de Estados (EPC-24 Sprint 04).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Controla exclusivamente o ciclo de vida estrutural de uma execução.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 * Nenhuma etapa do pipeline é processada — apenas transições estruturais.
 */
import type {
  CreateStateMachineInput,
  CreateStateMachineResult,
  ExecutionStateMachineHealth,
  ExecutionStateMachinePortCapabilities,
  ExecutionStateMachineProviderId,
  GetCurrentStateInput,
  GetCurrentStateResult,
  GetHistoryInput,
  GetHistoryResult,
  TransitionInput,
  TransitionResult,
} from "./types";

export interface ExecutionStateMachinePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionStateMachineProviderId;

  /** Cria uma máquina de estados estrutural para uma execução. */
  createStateMachine(input: CreateStateMachineInput): Promise<CreateStateMachineResult>;

  /** Realiza transição estrutural de estado (sem ações de negócio). */
  transition(input: TransitionInput): Promise<TransitionResult>;

  /** Obtém o estado corrente da máquina. */
  getCurrentState(input: GetCurrentStateInput): Promise<GetCurrentStateResult>;

  /** Obtém o histórico estrutural de transições. */
  getHistory(input: GetHistoryInput): Promise<GetHistoryResult>;

  /** Verificação leve de prontidão (sem alterar máquinas). */
  health(): Promise<ExecutionStateMachineHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionStateMachinePortCapabilities;
}
