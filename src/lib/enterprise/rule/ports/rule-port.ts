/**
 * RulePort — contrato único de regras (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, persistence ou banco ficam nos adapters.
 *
 * EPC-06A: fundação arquitetural genérica (infraestrutura).
 * NÃO conhece Paciente, Guia, Operadora, Contrato, Financeiro,
 * TISS, OCR, IA, Authorization, Auditoria ou Workflow clínico.
 *
 * NÃO avalia expressões. NÃO executa ações. NÃO faz parse/DSL.
 * Papel exclusivo nesta sprint: registrar / consultar / habilitar / desabilitar.
 */
import type {
  DisableRuleInput,
  DisableRuleResult,
  EnableRuleInput,
  EnableRuleResult,
  GetRuleInput,
  GetRuleResult,
  ListRulesInput,
  ListRulesResult,
  RegisterRuleInput,
  RegisterRuleResult,
  RuleCapabilities,
  RuleHealth,
  RuleProviderId,
} from "./types";

export interface RulePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: RuleProviderId;

  /** Verificação leve de prontidão (sem alterar regras). */
  health(): Promise<RuleHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): RuleCapabilities;

  /** Registra / atualiza uma definição de Rule genérica. */
  registerRule(input: RegisterRuleInput): Promise<RegisterRuleResult>;

  /** Obtém uma Rule por id ou nome/namespace. */
  getRule(input: GetRuleInput): Promise<GetRuleResult>;

  /** Lista Rules (filtros estruturais opcionais). */
  listRules(input?: ListRulesInput): Promise<ListRulesResult>;

  /** Habilita uma Rule (status → enabled). */
  enableRule(input: EnableRuleInput): Promise<EnableRuleResult>;

  /** Desabilita uma Rule (status → disabled). */
  disableRule(input: DisableRuleInput): Promise<DisableRuleResult>;
}
