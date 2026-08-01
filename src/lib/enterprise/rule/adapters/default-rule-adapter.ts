/**
 * DefaultRuleAdapter — adapter default de regras (EPC-06A).
 *
 * Encapsula o Default Rule Store (in-process) atrás do RulePort.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Persistence / Storage /
 * Metadata / Configuration / Workflow / UI / APIs.
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
} from "../ports/types";
import { createRuleDefinition, withRuleStatus } from "../factory";
import { DefaultRuleStore, type RuleStore } from "../store";

export const DEFAULT_RULE_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * (ex.: PersistencePort) sem acoplar o Port a detalhes de produto.
 */
export type DefaultRuleRuntime = {
  /** Store ativo. Default: DefaultRuleStore in-process. */
  store?: RuleStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
};

function defaultRuntime(): DefaultRuleRuntime {
  return {
    store: new DefaultRuleStore(),
  };
}

export class DefaultRuleAdapter implements RulePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultRuleRuntime;
  private readonly store: RuleStore;

  constructor(runtime: DefaultRuleRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultRuleStore();
  }

  capabilities(): RuleCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_RULE_ADAPTER_ID,
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ?? (probe.ok ? "Default rule probe ok." : "Default rule probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultRuleStore pronto (sem I/O externo — EPC-06A).",
    };
  }

  async registerRule(input: RegisterRuleInput): Promise<RegisterRuleResult> {
    const existing = this.store.getRule(input.rule.id);
    const rule = createRuleDefinition({
      rule: input.rule,
      existing,
      defaultStatus: "draft",
    });
    this.store.setRule(rule);
    return {
      ok: true,
      id: rule.id,
      message: existing ? "rule updated" : "rule registered",
      code: existing ? "updated" : "registered",
    };
  }

  async getRule(input: GetRuleInput): Promise<GetRuleResult> {
    if (input.id) {
      const byId = this.store.getRule(input.id);
      if (!byId) {
        return { ok: false, message: "not found", code: "not_found" };
      }
      return { ok: true, rule: byId };
    }

    const match = this.store.listRules().find((rule) => matchesRuleQuery(rule, input));
    if (!match) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, rule: match };
  }

  async listRules(input: ListRulesInput = {}): Promise<ListRulesResult> {
    const rules = this.store.listRules().filter((rule) => matchesListFilter(rule, input));
    return { ok: true, rules };
  }

  async enableRule(input: EnableRuleInput): Promise<EnableRuleResult> {
    const existing = this.store.getRule(input.id);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const rule = withRuleStatus(existing, "enabled");
    this.store.setRule(rule);
    return { ok: true, rule, message: "rule enabled", code: "enabled" };
  }

  async disableRule(input: DisableRuleInput): Promise<DisableRuleResult> {
    const existing = this.store.getRule(input.id);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const rule = withRuleStatus(existing, "disabled");
    this.store.setRule(rule);
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
