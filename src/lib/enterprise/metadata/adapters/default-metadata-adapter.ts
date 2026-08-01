/**
 * DefaultMetadataAdapter — adapter default de metadata (EPC-04).
 *
 * Encapsula o Default Metadata Store (in-process) atrás do MetadataPort.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Persistence / Storage /
 * Configuration / UI / APIs / Settings.
 */
import type { MetadataPort } from "../ports/metadata-port";
import type {
  GetEntityInput,
  GetEntityResult,
  GetSchemaInput,
  GetSchemaResult,
  ListSchemasInput,
  ListSchemasResult,
  ListTemplatesInput,
  ListTemplatesResult,
  MetadataCapabilities,
  MetadataEntity,
  MetadataHealth,
  MetadataSchema,
  RegisterEntityInput,
  RegisterEntityResult,
  RegisterSchemaInput,
  RegisterSchemaResult,
  RegisterTemplateInput,
  RegisterTemplateResult,
} from "../ports/types";
import { touchVersionInfo } from "../ports/versioning";
import { DefaultMetadataStore, type MetadataStore } from "../store";

export const DEFAULT_METADATA_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultMetadataRuntime = {
  /** Store ativo. Default: DefaultMetadataStore in-process. */
  store?: MetadataStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
};

function defaultRuntime(): DefaultMetadataRuntime {
  return {
    store: new DefaultMetadataStore(),
  };
}

export class DefaultMetadataAdapter implements MetadataPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultMetadataRuntime;
  private readonly store: MetadataStore;

  constructor(runtime: DefaultMetadataRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultMetadataStore();
  }

  capabilities(): MetadataCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_METADATA_ADAPTER_ID,
      supportsRegisterSchema: true,
      supportsGetSchema: true,
      supportsListSchemas: true,
      supportsRegisterEntity: true,
      supportsGetEntity: true,
      supportsRegisterTemplate: true,
      supportsListTemplates: true,
      supportsSchemaInheritance: true,
      supportsSchemaVersioning: true,
      supportsConstraints: true,
    };
  }

  async health(): Promise<MetadataHealth> {
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
          (probe.ok ? "Default metadata probe ok." : "Default metadata probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: storeHealth.message ?? "DefaultMetadataStore pronto (sem I/O externo — EPC-04).",
    };
  }

  async registerSchema(input: RegisterSchemaInput): Promise<RegisterSchemaResult> {
    const existing = this.store.getSchema(input.schema.id);
    const schema: MetadataSchema = {
      ...input.schema,
      versionInfo: existing
        ? touchVersionInfo({
            ...input.schema.versionInfo,
            createdAt: existing.versionInfo.createdAt,
          })
        : input.schema.versionInfo,
    };
    this.store.setSchema(schema);
    return {
      ok: true,
      id: schema.id,
      message: existing ? "schema updated" : "schema registered",
    };
  }

  async getSchema(input: GetSchemaInput): Promise<GetSchemaResult> {
    if (input.id) {
      const byId = this.store.getSchema(input.id);
      if (!byId) {
        return { ok: false, message: "not found" };
      }
      if (input.version && byId.versionInfo.version !== input.version) {
        return { ok: false, message: "version mismatch" };
      }
      return { ok: true, schema: byId };
    }

    const match = this.store.listSchemas().find((schema) => matchesSchemaQuery(schema, input));
    if (!match) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, schema: match };
  }

  async listSchemas(input: ListSchemasInput = {}): Promise<ListSchemasResult> {
    const schemas = this.store.listSchemas().filter((schema) => {
      if (input.namespace != null && schema.namespace !== input.namespace) return false;
      if (input.status != null && schema.versionInfo.status !== input.status) return false;
      if (input.category != null && schema.category !== input.category) return false;
      if (input.tag != null && !(schema.tags ?? []).includes(input.tag)) return false;
      if (input.namePrefix != null && !schema.name.startsWith(input.namePrefix)) return false;
      return true;
    });
    return { ok: true, schemas };
  }

  async registerEntity(input: RegisterEntityInput): Promise<RegisterEntityResult> {
    const existing = this.store.getEntity(input.entity.id);
    this.store.setEntity(input.entity);

    if (input.schemaId) {
      const schema = this.store.getSchema(input.schemaId);
      if (schema) {
        const refs = [...(schema.entities ?? [])];
        if (!refs.some((r) => r.id === input.entity.id)) {
          refs.push({ id: input.entity.id, name: input.entity.name, kind: "entity" });
        }
        this.store.setSchema({
          ...schema,
          entities: refs,
          versionInfo: touchVersionInfo(schema.versionInfo),
        });
      }
    }

    return {
      ok: true,
      id: input.entity.id,
      message: existing ? "entity updated" : "entity registered",
    };
  }

  async getEntity(input: GetEntityInput): Promise<GetEntityResult> {
    if (input.id) {
      const byId = this.store.getEntity(input.id);
      if (!byId) {
        return { ok: false, message: "not found" };
      }
      return { ok: true, entity: byId };
    }

    const match = this.store.listEntities().find((entity) => matchesEntityQuery(entity, input));
    if (!match) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, entity: match };
  }

  async registerTemplate(input: RegisterTemplateInput): Promise<RegisterTemplateResult> {
    const existing = this.store.getTemplate(input.template.id);
    this.store.setTemplate(input.template);
    return {
      ok: true,
      id: input.template.id,
      message: existing ? "template updated" : "template registered",
    };
  }

  async listTemplates(input: ListTemplatesInput = {}): Promise<ListTemplatesResult> {
    const templates = this.store.listTemplates().filter((template) => {
      if (input.namespace != null && template.namespace !== input.namespace) return false;
      if (input.category != null && template.category !== input.category) return false;
      if (input.tag != null && !(template.tags ?? []).includes(input.tag)) return false;
      if (input.namePrefix != null && !template.name.startsWith(input.namePrefix)) return false;
      if (input.schemaId != null && template.schemaRef?.id !== input.schemaId) return false;
      return true;
    });
    return { ok: true, templates };
  }
}

function matchesSchemaQuery(schema: MetadataSchema, input: GetSchemaInput): boolean {
  if (input.name != null && schema.name !== input.name) return false;
  if (input.namespace != null && schema.namespace !== input.namespace) return false;
  if (input.version != null && schema.versionInfo.version !== input.version) return false;
  return input.name != null;
}

function matchesEntityQuery(entity: MetadataEntity, input: GetEntityInput): boolean {
  if (input.name != null && entity.name !== input.name) return false;
  if (input.namespace != null && entity.namespace !== input.namespace) return false;
  return input.name != null;
}
