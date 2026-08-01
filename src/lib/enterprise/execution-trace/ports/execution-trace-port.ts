/**
 * ExecutionTracePort — contrato único do Rastreador Canônico de Execuções (EPC-24 Sprint 07).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Representa estruturalmente o rastreamento de uma execução.
 * NÃO escreve logs reais. NÃO envia telemetria. NÃO usa observabilidade externa.
 * NÃO persiste em banco. NÃO executa Engines.
 * Nenhuma operação acessa APIs externas.
 */
import type {
  AppendTraceInput,
  AppendTraceResult,
  CreateTraceInput,
  CreateTraceResult,
  ExecutionTracePortCapabilities,
  ExecutionTracePortHealth,
  ExecutionTraceProviderId,
  ExecutionTraceStatisticsResult,
  GetTraceInput,
  GetTraceResult,
  ListTraceEntriesInput,
  ListTraceEntriesResult,
} from "./types";

export interface ExecutionTracePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionTraceProviderId;

  /** Cria estruturalmente um Trace para uma execução. */
  createTrace(input: CreateTraceInput): Promise<CreateTraceResult>;

  /**
   * Anexa estruturalmente uma entrada ao Trace.
   * NÃO escreve logs. NÃO envia telemetria. NÃO persiste em banco.
   */
  appendTrace(input: AppendTraceInput): Promise<AppendTraceResult>;

  /** Obtém estruturalmente um Trace. */
  getTrace(input: GetTraceInput): Promise<GetTraceResult>;

  /** Lista estruturalmente entradas de um Trace. */
  listTraceEntries(input?: ListTraceEntriesInput): Promise<ListTraceEntriesResult>;

  /** Estatísticas estruturais do rastreador in-memory. */
  statistics(): Promise<ExecutionTraceStatisticsResult>;

  /** Verificação leve de prontidão (sem alterar o Trace). */
  health(): Promise<ExecutionTracePortHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionTracePortCapabilities;
}
