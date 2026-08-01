/**
 * MockHealthcareModelAdapter — EPC-19 / FASE 3.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
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
  HealthcareModelProviderId,
  ListHealthcareEntitiesInput,
  ListHealthcareEntitiesResult,
} from "../ports/types";
import { DefaultHealthcareModelStore, type HealthcareModelStore } from "../store";

export const MOCK_HEALTHCARE_MODEL_ADAPTER_ID = "mock-in-memory";
export const MOCK_HEALTHCARE_MODEL_VERSION = "1.0.0";

export type MockHealthcareModelAdapterOptions = {
  provider?: Extract<HealthcareModelProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: HealthcareModelStore;
  createId?: (kind?: string) => string;
  now?: () => string;
};

export class MockHealthcareModelAdapter implements HealthcareModelPort {
  readonly providerId: Extract<HealthcareModelProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: HealthcareModelStore;
  private readonly createId: (kind?: string) => string;
  private readonly now?: () => string;

  constructor(options: MockHealthcareModelAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} healthcare-model ready.`;
    this.store = options.store ?? new DefaultHealthcareModelStore();
    this.createId = options.createId ?? createHealthcareEntityId;
    this.now = options.now;
  }

  getStore(): HealthcareModelStore {
    return this.store;
  }

  capabilities(): HealthcareModelCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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

  async health(): Promise<HealthcareModelHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedEntityCount: this.store.entityCount(),
      storedRelationshipCount: this.store.relationshipCount(),
    };
  }

  async createEntity(input: CreateHealthcareEntityInput): Promise<CreateHealthcareEntityResult> {
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const id = input.entity.id || this.createId(input.entity.kind);
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
    if (!this.healthy) {
      return { ok: false, code: "unhealthy", message: this.message };
    }

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
    if (!this.healthy) {
      return { ok: false, entities: [], code: "unhealthy", message: this.message };
    }

    const entities = this.store.listEntities().filter((entity) => {
      if (input.kind != null && entity.kind !== input.kind) return false;
      if (input.status != null && entity.status !== input.status) return false;
      if (input.tag != null && !(entity.tags ?? []).includes(input.tag)) return false;
      if (input.idPrefix != null && !entity.id.startsWith(input.idPrefix)) return false;
      return true;
    });
    return { ok: true, entities, code: "listed" };
  }
}
