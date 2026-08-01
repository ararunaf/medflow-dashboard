/**
 * MockContractRuleBindingAdapter — EPC-17.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 * NÃO executa regras. NÃO carrega Contratos ou Rule Packs.
 */
import { createBindingId } from "../ports/identity";
import type { ContractRuleBindingPort } from "../ports/contract-rule-binding-port";
import type {
  BindRulePackInput,
  BindRulePackResult,
  ContractRuleBinding,
  ContractRuleBindingCapabilities,
  ContractRuleBindingHealth,
  ContractRuleBindingProviderId,
  GetBindingInput,
  GetBindingResult,
  ListBindingsInput,
  ListBindingsResult,
  UnbindRulePackInput,
  UnbindRulePackResult,
} from "../ports/types";

export type MockContractRuleBindingAdapterOptions = {
  provider?: Extract<ContractRuleBindingProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  bindings?: readonly ContractRuleBinding[];
  createId?: () => string;
  now?: () => string;
};

export class MockContractRuleBindingAdapter implements ContractRuleBindingPort {
  readonly providerId: Extract<ContractRuleBindingProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly bindings = new Map<string, ContractRuleBinding>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockContractRuleBindingAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} contract-rule-binding ready.`;
    this.createId = options.createId ?? createBindingId;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const binding of options.bindings ?? []) {
      this.bindings.set(binding.bindingId, binding);
    }
  }

  capabilities(): ContractRuleBindingCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsBindRulePack: true,
      supportsUnbindRulePack: true,
      supportsGetBinding: true,
      supportsListBindings: true,
      supportsMultipleRulePacksPerContract: true,
      supportsPriority: true,
      supportsExecutionOrder: true,
      supportsEffectiveDates: true,
      supportsVersioning: true,
      supportsLifecycleStatus: true,
      supportsMetadataReference: true,
      supportsConfigurationReference: true,
      supportsBindingPolicy: true,
      supportsFutureRuleEngine: true,
      supportsFutureExpressionEngine: true,
      supportsFutureWorkflow: true,
      supportsFutureAiAuditor: true,
      supportsFutureTissIntelligence: true,
    };
  }

  async health(): Promise<ContractRuleBindingHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async bindRulePack(input: BindRulePackInput): Promise<BindRulePackResult> {
    const stamp = this.now();
    const bindingId = input.binding.bindingId ?? this.createId();
    const existing = this.bindings.get(bindingId);

    const binding: ContractRuleBinding = {
      ...input.binding,
      bindingId,
      createdAt: existing?.createdAt ?? input.binding.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.binding.status ?? existing?.status ?? "DRAFT",
    };

    this.bindings.set(bindingId, binding);
    return {
      ok: true,
      bindingId,
      binding,
      message: existing ? "binding updated" : "binding created",
      code: existing ? "updated" : "created",
    };
  }

  async unbindRulePack(input: UnbindRulePackInput): Promise<UnbindRulePackResult> {
    const removed = this.bindings.delete(input.bindingId);
    if (!removed) {
      return {
        ok: false,
        bindingId: input.bindingId,
        message: "not found",
        code: "not_found",
      };
    }
    return {
      ok: true,
      bindingId: input.bindingId,
      message: "binding unbound",
      code: "unbound",
    };
  }

  async getBinding(input: GetBindingInput): Promise<GetBindingResult> {
    const binding = this.bindings.get(input.bindingId);
    if (!binding) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, binding, code: "ok" };
  }

  async listBindings(input: ListBindingsInput = {}): Promise<ListBindingsResult> {
    const bindings = [...this.bindings.values()].filter((binding) => matchesList(binding, input));
    return { ok: true, bindings };
  }
}

function matchesList(binding: ContractRuleBinding, input: ListBindingsInput): boolean {
  if (input.contractId != null) {
    const cid = binding.contractReference.contractId ?? binding.contractReference.id;
    if (cid !== input.contractId) return false;
  }
  if (input.packId != null) {
    const pid = binding.rulePackReference.packId ?? binding.rulePackReference.id;
    if (pid !== input.packId) return false;
  }
  if (input.status != null && binding.status !== input.status) return false;
  if (input.tag != null && !(binding.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !binding.bindingId.startsWith(input.idPrefix)) {
    return false;
  }
  if (input.bindingPolicy != null && binding.bindingPolicy !== input.bindingPolicy) {
    return false;
  }
  return true;
}
