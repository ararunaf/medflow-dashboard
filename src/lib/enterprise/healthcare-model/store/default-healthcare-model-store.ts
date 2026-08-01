/**
 * DefaultHealthcareModelStore — store in-process padrão (EPC-19).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  HealthcareModelStore,
  StoredHealthcareEntity,
  StoredHealthcareRelationship,
} from "./healthcare-model-store";

export const DEFAULT_HEALTHCARE_MODEL_STORE_ID = "default-in-process";

export type DefaultHealthcareModelStoreOptions = {
  entities?: readonly StoredHealthcareEntity[];
  relationships?: readonly StoredHealthcareRelationship[];
};

export class DefaultHealthcareModelStore implements HealthcareModelStore {
  readonly storeId = DEFAULT_HEALTHCARE_MODEL_STORE_ID;

  private readonly entities = new Map<string, StoredHealthcareEntity>();
  private readonly relationships = new Map<string, StoredHealthcareRelationship>();

  constructor(options: DefaultHealthcareModelStoreOptions = {}) {
    for (const entity of options.entities ?? []) {
      this.entities.set(entity.id, entity);
    }
    for (const relationship of options.relationships ?? []) {
      this.relationships.set(relationship.id, relationship);
    }
  }

  getEntity(entityId: string): StoredHealthcareEntity | undefined {
    return this.entities.get(entityId);
  }

  setEntity(entity: StoredHealthcareEntity): void {
    this.entities.set(entity.id, entity);
  }

  listEntities(): readonly StoredHealthcareEntity[] {
    return [...this.entities.values()];
  }

  removeEntity(entityId: string): boolean {
    return this.entities.delete(entityId);
  }

  entityCount(): number {
    return this.entities.size;
  }

  getRelationship(relationshipId: string): StoredHealthcareRelationship | undefined {
    return this.relationships.get(relationshipId);
  }

  setRelationship(relationship: StoredHealthcareRelationship): void {
    this.relationships.set(relationship.id, relationship);
  }

  listRelationships(): readonly StoredHealthcareRelationship[] {
    return [...this.relationships.values()];
  }

  removeRelationship(relationshipId: string): boolean {
    return this.relationships.delete(relationshipId);
  }

  relationshipCount(): number {
    return this.relationships.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultHealthcareModelStore ready (${this.entities.size} entities, ${this.relationships.size} relationships).`,
    };
  }
}
