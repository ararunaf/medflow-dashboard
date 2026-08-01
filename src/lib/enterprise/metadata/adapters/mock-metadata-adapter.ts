/**
 * MockMetadataAdapter — EPC-04.
 *
 * Permite testes, homologação, benchmark e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
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
  MetadataProviderId,
  MetadataSchema,
  MetadataTemplate,
  RegisterEntityInput,
  RegisterEntityResult,
  RegisterSchemaInput,
  RegisterSchemaResult,
  RegisterTemplateInput,
  RegisterTemplateResult,
} from "../ports/types";
import { touchVersionInfo } from "../ports/versioning";

export type MockMetadataAdapterOptions = {
  provider?: Extract<MetadataProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  schemas?: readonly MetadataSchema[];
  entities?: readonly MetadataEntity[];
  templates?: readonly MetadataTemplate[];
};

export class MockMetadataAdapter implements MetadataPort {
  readonly providerId: Extract<MetadataProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly schemas = new Map<string, MetadataSchema>();
  private readonly entities = new Map<string, MetadataEntity>();
  private readonly templates = new Map<string, MetadataTemplate>();

  constructor(options: MockMetadataAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} metadata ready.`;

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

  capabilities(): MetadataCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async registerSchema(input: RegisterSchemaInput): Promise<RegisterSchemaResult> {
    const existing = this.schemas.get(input.schema.id);
    const schema: MetadataSchema = {
      ...input.schema,
      versionInfo: existing
        ? touchVersionInfo({
            ...input.schema.versionInfo,
            createdAt: existing.versionInfo.createdAt,
          })
        : input.schema.versionInfo,
    };
    this.schemas.set(schema.id, schema);
    return {
      ok: true,
      id: schema.id,
      message: existing ? "schema updated" : "schema registered",
    };
  }

  async getSchema(input: GetSchemaInput): Promise<GetSchemaResult> {
    if (input.id) {
      const byId = this.schemas.get(input.id);
      if (!byId) {
        return { ok: false, message: "not found" };
      }
      if (input.version && byId.versionInfo.version !== input.version) {
        return { ok: false, message: "version mismatch" };
      }
      return { ok: true, schema: byId };
    }

    const match = [...this.schemas.values()].find((schema) => matchesSchemaQuery(schema, input));
    if (!match) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, schema: match };
  }

  async listSchemas(input: ListSchemasInput = {}): Promise<ListSchemasResult> {
    const schemas = [...this.schemas.values()].filter((schema) => {
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
    const existing = this.entities.get(input.entity.id);
    this.entities.set(input.entity.id, input.entity);

    if (input.schemaId) {
      const schema = this.schemas.get(input.schemaId);
      if (schema) {
        const refs = [...(schema.entities ?? [])];
        if (!refs.some((r) => r.id === input.entity.id)) {
          refs.push({ id: input.entity.id, name: input.entity.name, kind: "entity" });
        }
        this.schemas.set(input.schemaId, {
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
      const byId = this.entities.get(input.id);
      if (!byId) {
        return { ok: false, message: "not found" };
      }
      return { ok: true, entity: byId };
    }

    const match = [...this.entities.values()].find((entity) => matchesEntityQuery(entity, input));
    if (!match) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, entity: match };
  }

  async registerTemplate(input: RegisterTemplateInput): Promise<RegisterTemplateResult> {
    const existing = this.templates.get(input.template.id);
    this.templates.set(input.template.id, input.template);
    return {
      ok: true,
      id: input.template.id,
      message: existing ? "template updated" : "template registered",
    };
  }

  async listTemplates(input: ListTemplatesInput = {}): Promise<ListTemplatesResult> {
    const templates = [...this.templates.values()].filter((template) => {
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
