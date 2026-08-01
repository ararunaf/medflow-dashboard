/**
 * PersistencePort — contrato único de persistência (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de Supabase / Postgres / SQL Server / Oracle ficam nos adapters.
 *
 * EPC-01: fundação arquitetural. Operações de repositório serão adicionadas
 * em sprints posteriores sem alterar a camada de negócio que já depender do Port.
 */
import type { PersistenceCapabilities, PersistenceHealth, PersistenceMechanismId } from "./types";

export interface PersistencePort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly mechanismId: PersistenceMechanismId;

  /** Verificação leve de prontidão do mecanismo (sem alterar dados). */
  health(): Promise<PersistenceHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): PersistenceCapabilities;
}
