/**
 * RulePackPort — contrato único de Rule Pack Management (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-09: fundação arquitetural genérica.
 * NÃO conhece TISS, Operadoras, Cooperativas, Contratos, Guias,
 * Pacientes, Auditoria, OCR, IA ou Workflow clínico.
 *
 * Rule Pack é apenas um contêiner versionado de regras.
 */
import type {
  CreatePackInput,
  CreatePackResult,
  DisablePackInput,
  DisablePackResult,
  EnablePackInput,
  EnablePackResult,
  GetPackInput,
  GetPackResult,
  ListPacksInput,
  ListPacksResult,
  RulePackCapabilities,
  RulePackHealth,
  RulePackProviderId,
} from "./types";

export interface RulePackPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: RulePackProviderId;

  /** Verificação leve de prontidão (sem alterar packs). */
  health(): Promise<RulePackHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): RulePackCapabilities;

  /** Cria / registra um Rule Pack canônico. */
  createPack(input: CreatePackInput): Promise<CreatePackResult>;

  /** Obtém um pack por PackId. */
  getPack(input: GetPackInput): Promise<GetPackResult>;

  /** Lista packs (filtros estruturais opcionais). */
  listPacks(input?: ListPacksInput): Promise<ListPacksResult>;

  /** Habilita um pack (status → enabled). */
  enablePack(input: EnablePackInput): Promise<EnablePackResult>;

  /** Desabilita um pack (status → disabled). */
  disablePack(input: DisablePackInput): Promise<DisablePackResult>;
}
