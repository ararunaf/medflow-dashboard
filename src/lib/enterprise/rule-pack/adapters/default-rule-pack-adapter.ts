/**
 * DefaultRulePackAdapter — adapter default de Rule Pack Management (EPC-09).
 *
 * Encapsula o Default Rule Pack Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Rule Engine / UI / APIs.
 * NÃO resolve dependências automaticamente.
 */
import { createPackId } from "../ports/dependencies";
import type { RulePackPort } from "../ports/rule-pack-port";
import type {
  CreatePackInput,
  CreatePackResult,
  DisablePackInput,
  DisablePackResult,
  EnablePackInput,
  EnablePackResult,
  GetPackInput,
  GetPackResult,
  ListPacksInput,
  ListPacksResult,
  RulePack,
  RulePackCapabilities,
  RulePackHealth,
} from "../ports/types";
import { DefaultRulePackStore, type RulePackStore } from "../store";

export const DEFAULT_RULE_PACK_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultRulePackRuntime = {
  /** Store ativo. Default: DefaultRulePackStore in-process. */
  store?: RulePackStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultRulePackRuntime {
  return {
    store: new DefaultRulePackStore(),
  };
}

function nowIso(runtime: DefaultRulePackRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function withStatus(pack: RulePack, status: RulePack["status"], stamp: string): RulePack {
  return {
    ...pack,
    status,
    updatedAt: stamp,
  };
}

export class DefaultRulePackAdapter implements RulePackPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultRulePackRuntime;
  private readonly store: RulePackStore;

  constructor(runtime: DefaultRulePackRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultRulePackStore();
  }

  capabilities(): RulePackCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_RULE_PACK_ADAPTER_ID,
      supportsCreatePack: true,
      supportsGetPack: true,
      supportsListPacks: true,
      supportsEnablePack: true,
      supportsDisablePack: true,
      supportsVersioning: true,
      supportsDependencies: true,
      supportsRuleReferences: true,
      supportsMetadataReference: true,
    };
  }

  async health(): Promise<RulePackHealth> {
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
          (probe.ok ? "Default rule-pack probe ok." : "Default rule-pack probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultRulePackStore pronto (sem I/O externo — EPC-09).",
    };
  }

  async createPack(input: CreatePackInput): Promise<CreatePackResult> {
    const stamp = nowIso(this.runtime);
    const packId = input.pack.packId ?? this.runtime.createId?.() ?? createPackId();
    const existing = this.store.getPack(packId);

    const pack: RulePack = {
      ...input.pack,
      packId,
      name: input.pack.name,
      version: input.pack.version ?? existing?.version ?? "1",
      createdAt: existing?.createdAt ?? input.pack.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.pack.status ?? existing?.status ?? "draft",
    };

    this.store.setPack(pack);
    return {
      ok: true,
      packId,
      pack,
      message: existing ? "pack updated" : "pack created",
      code: existing ? "updated" : "created",
    };
  }

  async getPack(input: GetPackInput): Promise<GetPackResult> {
    const pack = this.store.getPack(input.packId);
    if (!pack) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, pack };
  }

  async listPacks(input: ListPacksInput = {}): Promise<ListPacksResult> {
    const packs = this.store.listPacks().filter((pack) => matchesList(pack, input));
    return { ok: true, packs };
  }

  async enablePack(input: EnablePackInput): Promise<EnablePackResult> {
    const existing = this.store.getPack(input.packId);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const pack = withStatus(existing, "enabled", nowIso(this.runtime));
    this.store.setPack(pack);
    return { ok: true, pack, message: "pack enabled", code: "enabled" };
  }

  async disablePack(input: DisablePackInput): Promise<DisablePackResult> {
    const existing = this.store.getPack(input.packId);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const pack = withStatus(existing, "disabled", nowIso(this.runtime));
    this.store.setPack(pack);
    return { ok: true, pack, message: "pack disabled", code: "disabled" };
  }
}

function matchesList(pack: RulePack, input: ListPacksInput): boolean {
  if (input.status != null && pack.status !== input.status) return false;
  if (input.priority != null && pack.priority !== input.priority) return false;
  if (input.tag != null && !(pack.tags ?? []).includes(input.tag)) return false;
  if (input.author != null && pack.author !== input.author) return false;
  if (input.lifecycle != null && pack.lifecycle !== input.lifecycle) return false;
  if (input.idPrefix != null && !pack.packId.startsWith(input.idPrefix)) return false;
  if (input.namePrefix != null && !pack.name.startsWith(input.namePrefix)) return false;
  if (input.dependsOn != null) {
    const deps = pack.dependencies ?? [];
    if (!deps.some((dep) => dep.packId === input.dependsOn)) return false;
  }
  return true;
}
