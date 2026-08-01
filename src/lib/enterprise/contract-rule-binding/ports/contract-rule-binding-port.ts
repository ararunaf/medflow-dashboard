/**
 * ContractRuleBindingPort — contrato único de vinculação Contrato ↔ Rule Pack.
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-17: camada canônica de Binding.
 * NÃO conhece Rule Engine, Expression Engine, TISS, OCR, AI Auditor,
 * Workflow operacional, validação contratual nem interpreta cláusulas.
 *
 * Binding representa uma ASSOCIAÇÃO CANÔNICA — nunca execução de regra.
 *
 * Arquitetura obrigatória:
 *   Contract → Contract Rule Binding → Rule Pack → Rule Engine → Expression Engine
 */
import type {
  BindRulePackInput,
  BindRulePackResult,
  ContractRuleBindingCapabilities,
  ContractRuleBindingHealth,
  ContractRuleBindingProviderId,
  GetBindingInput,
  GetBindingResult,
  ListBindingsInput,
  ListBindingsResult,
  UnbindRulePackInput,
  UnbindRulePackResult,
} from "./types";

export interface ContractRuleBindingPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ContractRuleBindingProviderId;

  /** Verificação leve de prontidão (sem alterar bindings). */
  health(): Promise<ContractRuleBindingHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ContractRuleBindingCapabilities;

  /** Vincula (cria/atualiza) um Rule Pack a um Contrato via Binding canônico. */
  bindRulePack(input: BindRulePackInput): Promise<BindRulePackResult>;

  /** Remove a vinculação (unbind) por BindingId. */
  unbindRulePack(input: UnbindRulePackInput): Promise<UnbindRulePackResult>;

  /** Obtém um Binding por BindingId. */
  getBinding(input: GetBindingInput): Promise<GetBindingResult>;

  /** Lista Bindings (filtros estruturais opcionais). */
  listBindings(input?: ListBindingsInput): Promise<ListBindingsResult>;
}
