/**
 * ExecutionContextPort — contrato único do Contexto Canônico de Execução (EPC-24 Sprint 03).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store / adapters ficam ocultos.
 *
 * Cria, propaga e enriquece estruturalmente o estado da execução.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 * Nenhuma etapa do pipeline é processada — apenas transporte estrutural.
 */
import type {
  CreateContextInput,
  CreateContextResult,
  ExecutionContextCapabilities,
  ExecutionContextHealth,
  ExecutionContextProviderId,
  GetContextInput,
  GetContextResult,
  ListContextsInput,
  ListContextsResult,
  UpdateContextInput,
  UpdateContextResult,
} from "./types";

export interface ExecutionContextPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ExecutionContextProviderId;

  /** Cria um Execution Context estrutural a partir do pedido canônico. */
  createContext(input?: CreateContextInput): Promise<CreateContextResult>;

  /** Atualiza / enriquece estruturalmente um contexto existente. */
  updateContext(input: UpdateContextInput): Promise<UpdateContextResult>;

  /** Obtém um contexto por id. */
  getContext(input: GetContextInput): Promise<GetContextResult>;

  /** Lista contextos conhecidos. */
  listContexts(input?: ListContextsInput): Promise<ListContextsResult>;

  /** Verificação leve de prontidão (sem alterar contextos). */
  health(): Promise<ExecutionContextHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ExecutionContextCapabilities;
}
