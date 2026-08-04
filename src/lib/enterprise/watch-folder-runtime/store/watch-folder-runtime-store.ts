/**
 * WatchFolderRuntimeStore — contrato interno do store (F3-CAP-02).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO abre watchers; NÃO captura; NÃO enumera hardware.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalWatchFolder,
  CanonicalWatchFolderObservation,
  CanonicalWatchFolderSession,
  CanonicalWatchFolderStatistics,
} from "../ports/canonical";

export type StoredCanonicalWatchFolder = CanonicalWatchFolder;
export type StoredCanonicalWatchFolderSession = CanonicalWatchFolderSession;
export type StoredCanonicalWatchFolderObservation = CanonicalWatchFolderObservation;

export interface WatchFolderRuntimeStore {
  readonly storeId: string;

  getWatchFolder(watchFolderId: string): StoredCanonicalWatchFolder | undefined;
  getWatchFolderByName(watchFolderName: string): StoredCanonicalWatchFolder | undefined;
  setWatchFolder(watchFolder: StoredCanonicalWatchFolder): void;
  removeWatchFolder(watchFolderId: string): void;
  listWatchFolders(): readonly StoredCanonicalWatchFolder[];

  getSession(sessionId: string): StoredCanonicalWatchFolderSession | undefined;
  setSession(session: StoredCanonicalWatchFolderSession): void;
  listSessions(watchFolderId?: string): readonly StoredCanonicalWatchFolderSession[];

  getObservation(observationId: string): StoredCanonicalWatchFolderObservation | undefined;
  setObservation(observation: StoredCanonicalWatchFolderObservation): void;
  listObservations(watchFolderId?: string): readonly StoredCanonicalWatchFolderObservation[];

  watchFolderCount(): number;
  sessionCount(): number;
  observationCount(): number;
  statistics(): CanonicalWatchFolderStatistics;
  health(): { ok: boolean; message?: string };
}
