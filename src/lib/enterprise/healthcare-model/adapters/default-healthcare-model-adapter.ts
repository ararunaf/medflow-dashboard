/**
 * DefaultHealthcareModelAdapter — adapter default in-memory (EPC-19 / FASE 2).
 *
 * Implementação totalmente in-memory.
 * Sem TISS. Sem ANS. Sem operadoras. Sem OCR. Sem IA. Sem banco.
 */
import { createHealthcareEntityId } from "../ports/identity";
import type { HealthcareModelPort } from "../ports/healthcare-model-port";
import type { HealthcareEntity } from "../ports/models";
import type {
  CreateHealthcareEntityInput,
  CreateHealthcareEntityResult,
  GetHealthcareEntityInput,
  GetHealthcareEntityResult,
  HealthcareModelCapabilities,
  HealthcareModelHealth,
  ListHealthcareEntitiesInput,
  ListHealthcareEntitiesResult,
} from "../ports/types";
import { DefaultHealthcareModelStore, type HealthcareModelStore } from "../store";

export const DEFAULT_HEALTHCARE_MODEL_ADAPTER_ID = "default-in-process";
export const DEFAULT_HEALTHCARE_MODEL_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultHealthcareModelRuntime = {
  /** Store ativo. Default: DefaultHealthcareModelStore in-process. */
  store?: HealthcareModelStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: (kind?: string) => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultHealthcareModelRuntime {
  return {
    store: new DefaultHealthcareModelStore(),
  };
}

function nowIso(runtime: DefaultHealthcareModelRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

function foundationCapabilities(
  provider: "default",
  adapterId: string,
): HealthcareModelCapabilities {
  return {
    provider,
    adapterId,
    supportsCreateEntity: true,
    supportsGetEntity: true,
    supportsListEntities: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsCanonicalHealthcareModels: true,
    supportsStructuralRelationships: true,
    supportsFutureOcr: true,
    supportsFutureDocumentProcessing: true,
    supportsFutureContractFoundation: true,
    supportsFutureRuleEngine: true,
    supportsFutureAiAuditor: true,
    supportsFutureTissIntelligence: true,
    supportsFutureWorkflow: true,
    knowsTiss: false,
    knowsAns: false,
    knowsOperatorOrCooperative: false,
  };
}

export class DefaultHealthcareModelAdapter implements HealthcareModelPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultHealthcareModelRuntime;
  private readonly store: HealthcareModelStore;

  constructor(runtime: DefaultHealthcareModelRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultHealthcareModelStore();
  }

  /** Acesso estrutural ao store (testes / demo). */
  getStore(): HealthcareModelStore {
    return this.store;
  }

  capabilities(): HealthcareModelCapabilities {
    return foundationCapabilities("default", DEFAULT_HEALTHCARE_MODEL_ADAPTER_ID);
  }

  async health(): Promise<HealthcareModelHealth> {
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
            ? "Default healthcare-model probe ok."
            : "Default healthcare-model probe falhou."),
        storedEntityCount: this.store.entityCount(),
        storedRelationshipCount: this.store.relationshipCount(),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultHealthcareModelStore pronto (sem I/O externo — EPC-19).",
      storedEntityCount: this.store.entityCount(),
      storedRelationshipCount: this.store.relationshipCount(),
    };
  }

  async createEntity(input: CreateHealthcareEntityInput): Promise<CreateHealthcareEntityResult> {
    const stamp = nowIso(this.runtime);
    const id =
      input.entity.id ||
      this.runtime.createId?.(input.entity.kind) ||
      createHealthcareEntityId(input.entity.kind);
    const existing = this.store.getEntity(id);

    const entity: HealthcareEntity = {
      ...input.entity,
      id,
      createdAt: existing?.createdAt ?? input.entity.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.entity.status ?? existing?.status ?? "draft",
      version: input.entity.version ?? existing?.version ?? "1",
    };

    this.store.setEntity(entity);
    return {
      ok: true,
      entityId: id,
      entity,
      code: existing ? "updated" : "created",
      message: existing ? "entity updated" : "entity created",
    };
  }

  async getEntity(input: GetHealthcareEntityInput): Promise<GetHealthcareEntityResult> {
    const entity = this.store.getEntity(input.entityId);
    if (!entity) {
      return { ok: false, code: "not_found", message: "not found" };
    }
    if (input.kind != null && entity.kind !== input.kind) {
      return { ok: false, code: "kind_mismatch", message: "kind mismatch" };
    }
    return { ok: true, entity, code: "found" };
  }

  async listEntities(
    input: ListHealthcareEntitiesInput = {},
  ): Promise<ListHealthcareEntitiesResult> {
    const entities = this.store.listEntities().filter((entity) => matchesList(entity, input));
    return { ok: true, entities, code: "listed" };
  }
}

function matchesList(entity: HealthcareEntity, input: ListHealthcareEntitiesInput): boolean {
  if (input.kind != null && entity.kind !== input.kind) return false;
  if (input.status != null && entity.status !== input.status) return false;
  if (input.tag != null && !(entity.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !entity.id.startsWith(input.idPrefix)) return false;
  return true;
}
