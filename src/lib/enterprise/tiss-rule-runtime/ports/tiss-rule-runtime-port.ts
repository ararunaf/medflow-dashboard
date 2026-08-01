/**
 * TISSRuleRuntimePort — contrato único do TISS Rule Runtime (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou adapters ficam fora do Domain.
 *
 * EPC-23: fundação da orquestração do pipeline Enterprise.
 * O Runtime NÃO toma decisões. NÃO interpreta regras. NÃO interpreta contratos.
 * NÃO implementa validação TISS, ANS, OCR, AI, parser XML, banco, APIs, UI
 * ou migrations.
 */
import type {
  CollectResultsInput,
  CollectResultsResult,
  DispatchRulesInput,
  DispatchRulesResult,
  ResolveBindingsInput,
  ResolveBindingsResult,
  ResolveProfileInput,
  ResolveProfileResult,
  ResolveRulePacksInput,
  ResolveRulePacksResult,
  StartExecutionInput,
  StartExecutionResult,
  TISSRuleRuntimeCapabilities,
  TISSRuleRuntimeHealth,
  TISSRuleRuntimeProviderId,
} from "./types";

export interface TISSRuleRuntimePort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: TISSRuleRuntimeProviderId;

  /**
   * Inicia uma execução a partir de referência ao Healthcare Model.
   * Cria contexto, pipeline e trace estruturais. Sem decisões.
   */
  startExecution(input: StartExecutionInput): Promise<StartExecutionResult>;

  /**
   * Resolve estruturalmente o TISS Profile.
   * Sem lookup real. Sem validação. Sem regras.
   */
  resolveProfile(input: ResolveProfileInput): Promise<ResolveProfileResult>;

  /**
   * Resolve estruturalmente Contract Rule Bindings.
   * Sem interpretação de contratos. Sem regras.
   */
  resolveBindings(input: ResolveBindingsInput): Promise<ResolveBindingsResult>;

  /**
   * Resolve estruturalmente Rule Packs.
   * Sem carregar ou executar packs.
   */
  resolveRulePacks(input: ResolveRulePacksInput): Promise<ResolveRulePacksResult>;

  /**
   * Despacha estruturalmente para o Rule Engine.
   * NÃO executa regras. NÃO invoca Expression Engine.
   */
  dispatchRules(input: DispatchRulesInput): Promise<DispatchRulesResult>;

  /**
   * Coleta o resultado estrutural sem interpretá-lo.
   */
  collectResults(input: CollectResultsInput): Promise<CollectResultsResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<TISSRuleRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TISSRuleRuntimeCapabilities;
}
