/**
 * CanonicalExecutionOrchestratorPort — contrato único do Orquestrador Canônico (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou adapters ficam fora do Domain.
 *
 * EPC-24 Sprint 01: fundação da orquestração canônica Enterprise.
 * O Orquestrador NÃO executa OCR, IA, Mapping, regras TISS, validações,
 * parser XML, banco, APIs, UI ou migrations.
 * Coordena exclusivamente via Ports oficiais da Foundation.
 */
import type {
  CanonicalExecutionOrchestratorCapabilities,
  CanonicalExecutionOrchestratorHealth,
  CanonicalExecutionOrchestratorProviderId,
  GetExecutionInput,
  GetExecutionResult,
  ListExecutionsInput,
  ListExecutionsResult,
  StartExecutionInput,
  StartExecutionResult,
} from "./types";

export interface CanonicalExecutionOrchestratorPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: CanonicalExecutionOrchestratorProviderId;

  /**
   * Inicia uma execução canônica e percorre estruturalmente o pipeline
   * Document Intake → … → AI Auditor.
   * Cria contexto, steps, result e trace. Sem invocação real de Engines.
   */
  startExecution(input?: StartExecutionInput): Promise<StartExecutionResult>;

  /**
   * Obtém uma execução previamente orquestrada (contexto + result + trace).
   */
  getExecution(input: GetExecutionInput): Promise<GetExecutionResult>;

  /**
   * Lista execuções armazenadas in-memory (filtros estruturais opcionais).
   */
  listExecutions(input?: ListExecutionsInput): Promise<ListExecutionsResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<CanonicalExecutionOrchestratorHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): CanonicalExecutionOrchestratorCapabilities;
}
