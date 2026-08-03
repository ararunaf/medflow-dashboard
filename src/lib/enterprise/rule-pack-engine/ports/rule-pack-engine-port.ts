/**
 * RulePackEnginePort — contrato único do Enterprise Rule Pack Engine (TISS-03).
 *
 * Application / TISS Runtime dependem exclusivamente desta interface.
 * Nenhum acesso direto ao Rule Pack Store é permitido.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort → Adapter → Rule Pack Store
 *
 * TISS-03: mecanismo genérico apenas — sem XML / operadoras / contratos / tenants / ANS.
 */
import type {
  ExecutePackInput,
  ExecutePackResult,
  GetExecutionInput,
  GetExecutionResult,
  InterpretPackInput,
  InterpretPackResult,
  ListExecutionsInput,
  ListExecutionsResult,
  ListPacksInput,
  ListPacksResult,
  LoadPackInput,
  LoadPackResult,
  RulePackEngineHealth,
  RulePackEngineInfo,
  RulePackEnginePortCapabilities,
  RulePackEngineProviderId,
} from "./types";

export interface RulePackEnginePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: RulePackEngineProviderId;

  /** Carrega um Rule Pack canônico do store (via Adapter). */
  loadPack(input: LoadPackInput): Promise<LoadPackResult>;

  /** Lista Rule Packs canônicos. */
  listPacks(input?: ListPacksInput): Promise<ListPacksResult>;

  /**
   * Interpreta um Rule Pack: resolve referências de catálogo via TISSCatalogPort.
   * Não executa regras de negócio.
   */
  interpretPack(input: InterpretPackInput): Promise<InterpretPackResult>;

  /**
   * Executa um Rule Pack estruturalmente e retorna resultado canônico.
   * Conhecimento TISS exclusivamente via TISSCatalogPort.
   */
  executePack(input: ExecutePackInput): Promise<ExecutePackResult>;

  getExecution(input: GetExecutionInput): Promise<GetExecutionResult>;
  listExecutions(input?: ListExecutionsInput): Promise<ListExecutionsResult>;

  health(): Promise<RulePackEngineHealth>;
  capabilities(): RulePackEnginePortCapabilities;
  providerInfo(): RulePackEngineInfo;
}
