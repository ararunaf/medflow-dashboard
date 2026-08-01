/**
 * ConfigurationStore — contrato interno do store (EPC-03).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations.
 */
import type { ConfigurationEntry } from "../ports/types";

export type StoredConfigurationEntry = ConfigurationEntry;

export interface ConfigurationStore {
  readonly storeId: string;

  get(storageKey: string): StoredConfigurationEntry | undefined;

  set(storageKey: string, entry: StoredConfigurationEntry): void;

  exists(storageKey: string): boolean;

  remove(storageKey: string): boolean;

  list(prefix?: string): readonly StoredConfigurationEntry[];

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
