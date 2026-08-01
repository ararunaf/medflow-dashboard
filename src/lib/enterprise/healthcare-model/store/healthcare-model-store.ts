/**
 * HealthcareModelStore — contrato interno do store (EPC-19).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO conhece TISS/ANS/operadoras.
 */
import type { HealthcareEntity } from "../ports/models";
import type { HealthcareRelationship } from "../ports/relationships";

export type StoredHealthcareEntity = HealthcareEntity;
export type StoredHealthcareRelationship = HealthcareRelationship;

export interface HealthcareModelStore {
  readonly storeId: string;

  getEntity(entityId: string): StoredHealthcareEntity | undefined;
  setEntity(entity: StoredHealthcareEntity): void;
  listEntities(): readonly StoredHealthcareEntity[];
  removeEntity(entityId: string): boolean;
  entityCount(): number;

  getRelationship(relationshipId: string): StoredHealthcareRelationship | undefined;
  setRelationship(relationship: StoredHealthcareRelationship): void;
  listRelationships(): readonly StoredHealthcareRelationship[];
  removeRelationship(relationshipId: string): boolean;
  relationshipCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
