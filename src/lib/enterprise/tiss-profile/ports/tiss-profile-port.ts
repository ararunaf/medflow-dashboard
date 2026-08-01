/**
 * TISSProfilePort — contrato único do TISS Profile (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou adapters ficam fora do Domain.
 *
 * EPC-22: fundação da estrutura canônica documental TISS.
 * NÃO implementa parser XML, OCR, AI, Rule Engine, Workflow,
 * contratos, validações, regras, banco, APIs, UI ou migrations.
 */
import type {
  GetProfileInput,
  GetProfileResult,
  ListProfilesInput,
  ListProfilesResult,
  RegisterProfileInput,
  RegisterProfileResult,
  TISSProfileCapabilities,
  TISSProfileHealth,
  TISSProfileProviderId,
} from "./types";

export interface TISSProfilePort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: TISSProfileProviderId;

  /**
   * Registra / atualiza um Profile estrutural no store in-process.
   * Sem validação. Sem regras. Sem contratos. Sem parser.
   */
  registerProfile(input: RegisterProfileInput): Promise<RegisterProfileResult>;

  /** Obtém um Profile por id, código ou nome. */
  getProfile(input: GetProfileInput): Promise<GetProfileResult>;

  /** Lista Profiles (filtros estruturais opcionais). */
  listProfiles(input?: ListProfilesInput): Promise<ListProfilesResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<TISSProfileHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): TISSProfileCapabilities;
}
