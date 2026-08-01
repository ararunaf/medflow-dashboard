/**
 * DefaultMetadataStore — store in-process padrão (EPC-04).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type {
  MetadataStore,
  StoredMetadataEntity,
  StoredMetadataSchema,
  StoredMetadataTemplate,
} from "./metadata-store";

export const DEFAULT_METADATA_STORE_ID = "default-in-process";

export type DefaultMetadataStoreOptions = {
  schemas?: readonly StoredMetadataSchema[];
  entities?: readonly StoredMetadataEntity[];
  templates?: readonly StoredMetadataTemplate[];
};

export class DefaultMetadataStore implements MetadataStore {
  readonly storeId = DEFAULT_METADATA_STORE_ID;

  private readonly schemas = new Map<string, StoredMetadataSchema>();
  private readonly entities = new Map<string, StoredMetadataEntity>();
  private readonly templates = new Map<string, StoredMetadataTemplate>();

  constructor(options: DefaultMetadataStoreOptions = {}) {
    for (const schema of options.schemas ?? []) {
      this.schemas.set(schema.id, schema);
    }
    for (const entity of options.entities ?? []) {
      this.entities.set(entity.id, entity);
    }
    for (const template of options.templates ?? []) {
      this.templates.set(template.id, template);
    }
  }

  getSchema(id: string): StoredMetadataSchema | undefined {
    return this.schemas.get(id);
  }

  setSchema(schema: StoredMetadataSchema): void {
    this.schemas.set(schema.id, schema);
  }

  listSchemas(): readonly StoredMetadataSchema[] {
    return [...this.schemas.values()];
  }

  removeSchema(id: string): boolean {
    return this.schemas.delete(id);
  }

  getEntity(id: string): StoredMetadataEntity | undefined {
    return this.entities.get(id);
  }

  setEntity(entity: StoredMetadataEntity): void {
    this.entities.set(entity.id, entity);
  }

  listEntities(): readonly StoredMetadataEntity[] {
    return [...this.entities.values()];
  }

  removeEntity(id: string): boolean {
    return this.entities.delete(id);
  }

  getTemplate(id: string): StoredMetadataTemplate | undefined {
    return this.templates.get(id);
  }

  setTemplate(template: StoredMetadataTemplate): void {
    this.templates.set(template.id, template);
  }

  listTemplates(): readonly StoredMetadataTemplate[] {
    return [...this.templates.values()];
  }

  removeTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultMetadataStore ready (${this.schemas.size} schemas, ${this.entities.size} entities, ${this.templates.size} templates).`,
    };
  }
}
