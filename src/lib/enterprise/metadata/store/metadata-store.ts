/**
 * MetadataStore — contrato interno do store (EPC-04).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations.
 */
import type { MetadataEntity, MetadataSchema, MetadataTemplate } from "../ports/types";

export type StoredMetadataSchema = MetadataSchema;
export type StoredMetadataEntity = MetadataEntity;
export type StoredMetadataTemplate = MetadataTemplate;

export interface MetadataStore {
  readonly storeId: string;

  getSchema(id: string): StoredMetadataSchema | undefined;
  setSchema(schema: StoredMetadataSchema): void;
  listSchemas(): readonly StoredMetadataSchema[];
  removeSchema(id: string): boolean;

  getEntity(id: string): StoredMetadataEntity | undefined;
  setEntity(entity: StoredMetadataEntity): void;
  listEntities(): readonly StoredMetadataEntity[];
  removeEntity(id: string): boolean;

  getTemplate(id: string): StoredMetadataTemplate | undefined;
  setTemplate(template: StoredMetadataTemplate): void;
  listTemplates(): readonly StoredMetadataTemplate[];
  removeTemplate(id: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
