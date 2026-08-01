/**
 * MetadataPort — contrato único de metadata (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-04: fundação arquitetural genérica.
 * NÃO conhece Paciente, Profissional, Guia, Contrato, Operadora,
 * TISS, OCR, IA, Workflow ou Storage.
 */
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
  MetadataHealth,
  MetadataProviderId,
  RegisterEntityInput,
  RegisterEntityResult,
  RegisterSchemaInput,
  RegisterSchemaResult,
  RegisterTemplateInput,
  RegisterTemplateResult,
} from "./types";

export interface MetadataPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: MetadataProviderId;

  /** Verificação leve de prontidão (sem alterar metadata). */
  health(): Promise<MetadataHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): MetadataCapabilities;

  /** Registra / atualiza um Schema genérico. */
  registerSchema(input: RegisterSchemaInput): Promise<RegisterSchemaResult>;

  /** Obtém um Schema por id, nome/namespace ou versão. */
  getSchema(input: GetSchemaInput): Promise<GetSchemaResult>;

  /** Lista Schemas (filtros estruturais opcionais). */
  listSchemas(input?: ListSchemasInput): Promise<ListSchemasResult>;

  /** Registra / atualiza uma Entity genérica. */
  registerEntity(input: RegisterEntityInput): Promise<RegisterEntityResult>;

  /** Obtém uma Entity por id ou nome/namespace. */
  getEntity(input: GetEntityInput): Promise<GetEntityResult>;

  /** Registra / atualiza um Template genérico (infra). */
  registerTemplate(input: RegisterTemplateInput): Promise<RegisterTemplateResult>;

  /** Lista Templates (filtros estruturais opcionais). */
  listTemplates(input?: ListTemplatesInput): Promise<ListTemplatesResult>;
}
