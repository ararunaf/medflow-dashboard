/**
 * Tipos vendor-agnósticos da camada de persistência — EPC-01.
 *
 * Nenhum tipo do Supabase, PostgREST ou SDK de banco deve aparecer aqui.
 */

/** Mecanismos de persistência suportados (extensível). */
export type PersistenceMechanismId =
  | "supabase"
  | "postgres"
  | "sqlserver"
  | "oracle"
  | "mock"
  | "test";

/** Resultado de health check do mecanismo de persistência. */
export type PersistenceHealth = {
  ok: boolean;
  mechanism: PersistenceMechanismId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o vendor.
 */
export type PersistenceCapabilities = {
  mechanism: PersistenceMechanismId;
  /** Identificador legível do adapter (ex.: supabase-default). */
  adapterId: string;
  supportsTransactions: boolean;
  supportsRowLevelSecurity: boolean;
  supportsRealtime: boolean;
  supportsJsonDocuments: boolean;
};

/** Opções de resolução do PersistencePort (provider). */
export type PersistenceProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção: `supabase`.
   * Em testes: `mock` | `test`.
   */
  mechanism?: PersistenceMechanismId;
};
