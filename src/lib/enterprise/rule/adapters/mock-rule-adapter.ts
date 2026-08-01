/**
 * MockRuleAdapter — EPC-06A.
 *
 * Permite testes, homologação, benchmark e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 *
 * NÃO avalia expressões. NÃO executa actions.
 */
import type { RulePort } from "../ports/rule-port";
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
  RuleDefinition,
  RuleHealth,
  RuleProviderId,
} from "../ports/types";
import { createRuleDefinition, withRuleStatus } from "../factory";

export type MockRuleAdapterOptions = {
  provider?: Extract<RuleProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  rules?: readonly RuleDefinition[];
};

export class MockRuleAdapter implements RulePort {
  readonly providerId: Extract<RuleProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly rules = new Map<string, RuleDefinition>();

  constructor(options: MockRuleAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} rule ready.`;

    for (const rule of options.rules ?? []) {
      this.rules.set(rule.id, rule);
    }
  }

  capabilities(): RuleCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsRegisterRule: true,
      supportsGetRule: true,
      supportsListRules: true,
      supportsEnableRule: true,
      supportsDisableRule: true,
      supportsOperatorCatalog: true,
      supportsActionCatalog: true,
      supportsPriorityCatalog: true,
      supportsEvaluation: false,
    };
  }

  async health(): Promise<RuleHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async registerRule(input: RegisterRuleInput): Promise<RegisterRuleResult> {
    const existing = this.rules.get(input.rule.id);
    const rule = createRuleDefinition({
      rule: input.rule,
      existing,
      defaultStatus: "draft",
    });
    this.rules.set(rule.id, rule);
    return {
      ok: true,
      id: rule.id,
      message: existing ? "rule updated" : "rule registered",
      code: existing ? "updated" : "registered",
    };
  }

  async getRule(input: GetRuleInput): Promise<GetRuleResult> {
    if (input.id) {
      const byId = this.rules.get(input.id);
      if (!byId) {
        return { ok: false, message: "not found", code: "not_found" };
      }
      return { ok: true, rule: byId };
    }

    const match = [...this.rules.values()].find((rule) => matchesRuleQuery(rule, input));
    if (!match) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, rule: match };
  }

  async listRules(input: ListRulesInput = {}): Promise<ListRulesResult> {
    const rules = [...this.rules.values()].filter((rule) => matchesListFilter(rule, input));
    return { ok: true, rules };
  }

  async enableRule(input: EnableRuleInput): Promise<EnableRuleResult> {
    const existing = this.rules.get(input.id);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const rule = withRuleStatus(existing, "enabled");
    this.rules.set(rule.id, rule);
    return { ok: true, rule, message: "rule enabled", code: "enabled" };
  }

  async disableRule(input: DisableRuleInput): Promise<DisableRuleResult> {
    const existing = this.rules.get(input.id);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const rule = withRuleStatus(existing, "disabled");
    this.rules.set(rule.id, rule);
    return { ok: true, rule, message: "rule disabled", code: "disabled" };
  }
}

function matchesRuleQuery(rule: RuleDefinition, input: GetRuleInput): boolean {
  if (input.name != null && rule.name !== input.name) return false;
  if (input.namespace != null && rule.namespace !== input.namespace) return false;
  return input.name != null;
}

function matchesListFilter(rule: RuleDefinition, input: ListRulesInput): boolean {
  if (input.namespace != null && rule.namespace !== input.namespace) return false;
  if (input.status != null && (rule.status ?? "draft") !== input.status) return false;
  if (input.priority != null && rule.priority !== input.priority) return false;
  if (input.category != null && rule.category !== input.category) return false;
  if (input.tag != null && !(rule.tags ?? []).includes(input.tag)) return false;
  if (input.namePrefix != null && !rule.name.startsWith(input.namePrefix)) return false;
  return true;
}
