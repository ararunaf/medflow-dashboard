/**
 * HealthcareModelPort — contrato único do Canonical Healthcare Model (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou adapters ficam fora do Domain.
 *
 * EPC-19: fundação do Modelo Canônico Enterprise de Dados da Saúde.
 * NÃO implementa TISS, TUSS, CID, ANS, operadoras, cooperativas,
 * OCR, IA, Workflow, Rule Engine, APIs, banco, UI ou migrations.
 */
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
} from "./types";

export interface HealthcareModelPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: HealthcareModelProviderId;

  /**
   * Cria / registra uma entidade canônica no store in-process.
   * Sem validação de negócio. Sem lógica clínica.
   */
  createEntity(input: CreateHealthcareEntityInput): Promise<CreateHealthcareEntityResult>;

  /** Obtém uma entidade canônica por id. */
  getEntity(input: GetHealthcareEntityInput): Promise<GetHealthcareEntityResult>;

  /** Lista entidades canônicas (filtros estruturais opcionais). */
  listEntities(input?: ListHealthcareEntitiesInput): Promise<ListHealthcareEntitiesResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<HealthcareModelHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): HealthcareModelCapabilities;
}
