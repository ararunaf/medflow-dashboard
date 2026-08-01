/**
 * MockRulePackAdapter — EPC-09.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
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
  RulePackProviderId,
} from "../ports/types";

export type MockRulePackAdapterOptions = {
  provider?: Extract<RulePackProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  packs?: readonly RulePack[];
  createId?: () => string;
  now?: () => string;
};

function withStatus(pack: RulePack, status: RulePack["status"], stamp: string): RulePack {
  return {
    ...pack,
    status,
    updatedAt: stamp,
  };
}

export class MockRulePackAdapter implements RulePackPort {
  readonly providerId: Extract<RulePackProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly packs = new Map<string, RulePack>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockRulePackAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} rule-pack ready.`;
    this.createId = options.createId ?? createPackId;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const pack of options.packs ?? []) {
      this.packs.set(pack.packId, pack);
    }
  }

  capabilities(): RulePackCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createPack(input: CreatePackInput): Promise<CreatePackResult> {
    const stamp = this.now();
    const packId = input.pack.packId ?? this.createId();
    const existing = this.packs.get(packId);

    const pack: RulePack = {
      ...input.pack,
      packId,
      name: input.pack.name,
      version: input.pack.version ?? existing?.version ?? "1",
      createdAt: existing?.createdAt ?? input.pack.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.pack.status ?? existing?.status ?? "draft",
    };

    this.packs.set(packId, pack);
    return {
      ok: true,
      packId,
      pack,
      message: existing ? "pack updated" : "pack created",
      code: existing ? "updated" : "created",
    };
  }

  async getPack(input: GetPackInput): Promise<GetPackResult> {
    const pack = this.packs.get(input.packId);
    if (!pack) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, pack };
  }

  async listPacks(input: ListPacksInput = {}): Promise<ListPacksResult> {
    const packs = [...this.packs.values()].filter((pack) => matchesList(pack, input));
    return { ok: true, packs };
  }

  async enablePack(input: EnablePackInput): Promise<EnablePackResult> {
    const existing = this.packs.get(input.packId);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const pack = withStatus(existing, "enabled", this.now());
    this.packs.set(pack.packId, pack);
    return { ok: true, pack, message: "pack enabled", code: "enabled" };
  }

  async disablePack(input: DisablePackInput): Promise<DisablePackResult> {
    const existing = this.packs.get(input.packId);
    if (!existing) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    const pack = withStatus(existing, "disabled", this.now());
    this.packs.set(pack.packId, pack);
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
