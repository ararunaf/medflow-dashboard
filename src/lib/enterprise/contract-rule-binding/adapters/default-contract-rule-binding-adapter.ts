/**
 * DefaultContractRuleBindingAdapter — adapter default de Binding (EPC-17).
 *
 * Encapsula o Default Contract Rule Binding Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Auth / UI / APIs.
 * NÃO carrega Contratos, Rule Packs, Rule Engine ou Expression Engine.
 * NÃO executa regras. NÃO valida cláusulas.
 */
import { createBindingId } from "../ports/identity";
import type { ContractRuleBindingPort } from "../ports/contract-rule-binding-port";
import type {
  BindRulePackInput,
  BindRulePackResult,
  ContractRuleBinding,
  ContractRuleBindingCapabilities,
  ContractRuleBindingHealth,
  GetBindingInput,
  GetBindingResult,
  ListBindingsInput,
  ListBindingsResult,
  UnbindRulePackInput,
  UnbindRulePackResult,
} from "../ports/types";
import { DefaultContractRuleBindingStore, type ContractRuleBindingStore } from "../store";

export const DEFAULT_CONTRACT_RULE_BINDING_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultContractRuleBindingRuntime = {
  /** Store ativo. Default: DefaultContractRuleBindingStore in-process. */
  store?: ContractRuleBindingStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultContractRuleBindingRuntime {
  return {
    store: new DefaultContractRuleBindingStore(),
  };
}

function nowIso(runtime: DefaultContractRuleBindingRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultContractRuleBindingAdapter implements ContractRuleBindingPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultContractRuleBindingRuntime;
  private readonly store: ContractRuleBindingStore;

  constructor(runtime: DefaultContractRuleBindingRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultContractRuleBindingStore();
  }

  capabilities(): ContractRuleBindingCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_CONTRACT_RULE_BINDING_ADAPTER_ID,
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default contract-rule-binding probe ok."
            : "Default contract-rule-binding probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultContractRuleBindingStore pronto (sem I/O externo — EPC-17).",
    };
  }

  async bindRulePack(input: BindRulePackInput): Promise<BindRulePackResult> {
    const stamp = nowIso(this.runtime);
    const bindingId = input.binding.bindingId ?? this.runtime.createId?.() ?? createBindingId();
    const existing = this.store.getBinding(bindingId);

    const binding: ContractRuleBinding = {
      ...input.binding,
      bindingId,
      createdAt: existing?.createdAt ?? input.binding.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.binding.status ?? existing?.status ?? "DRAFT",
    };

    this.store.setBinding(binding);
    return {
      ok: true,
      bindingId,
      binding,
      message: existing ? "binding updated" : "binding created",
      code: existing ? "updated" : "created",
    };
  }

  async unbindRulePack(input: UnbindRulePackInput): Promise<UnbindRulePackResult> {
    const removed = this.store.removeBinding(input.bindingId);
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
    const binding = this.store.getBinding(input.bindingId);
    if (!binding) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, binding, code: "ok" };
  }

  async listBindings(input: ListBindingsInput = {}): Promise<ListBindingsResult> {
    const bindings = this.store.listBindings().filter((binding) => matchesList(binding, input));
    return { ok: true, bindings };
  }
}

function matchesList(binding: ContractRuleBinding, input: ListBindingsInput): boolean {
  if (input.contractId != null) {
    const cid = contractOpaqueId(binding);
    if (cid !== input.contractId) return false;
  }
  if (input.packId != null) {
    const pid = packOpaqueId(binding);
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

function contractOpaqueId(binding: ContractRuleBinding): string | undefined {
  return binding.contractReference.contractId ?? binding.contractReference.id;
}

function packOpaqueId(binding: ContractRuleBinding): string | undefined {
  return binding.rulePackReference.packId ?? binding.rulePackReference.id;
}
