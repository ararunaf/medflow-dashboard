/**
 * InMemoryWatchFolderRuntimeStore — store in-process (F3-CAP-02).
 *
 * Implementação oficial do Watch Folder Runtime Store.
 * Sem banco. Sem watchers. Sem Local/Network/UNC/SMB/Azure Files. Sem Scanner real.
 */
import type { CanonicalWatchFolderStatistics } from "../ports/canonical";
import type {
  StoredCanonicalWatchFolder,
  StoredCanonicalWatchFolderObservation,
  StoredCanonicalWatchFolderSession,
  WatchFolderRuntimeStore,
} from "./watch-folder-runtime-store";

export const IN_MEMORY_WATCH_FOLDER_RUNTIME_STORE_ID = "in-memory-watch-folder-runtime";

export type InMemoryWatchFolderRuntimeStoreOptions = {
  watchFolders?: readonly StoredCanonicalWatchFolder[];
  sessions?: readonly StoredCanonicalWatchFolderSession[];
  observations?: readonly StoredCanonicalWatchFolderObservation[];
};

/**
 * Store de Scanners/sessões/aquisições canônicas in-memory — exclusivo do Adapter (F3-CAP-02).
 */
export class InMemoryWatchFolderRuntimeStore implements WatchFolderRuntimeStore {
  readonly storeId = IN_MEMORY_WATCH_FOLDER_RUNTIME_STORE_ID;

  private readonly watchFolders = new Map<string, StoredCanonicalWatchFolder>();
  private readonly byName = new Map<string, string>();
  private readonly sessions = new Map<string, StoredCanonicalWatchFolderSession>();
  private readonly observations = new Map<string, StoredCanonicalWatchFolderObservation>();

  constructor(options: InMemoryWatchFolderRuntimeStoreOptions = {}) {
    for (const watchFolder of options.watchFolders ?? []) {
      this.setWatchFolder(watchFolder);
    }
    for (const session of options.sessions ?? []) {
      this.setSession(session);
    }
    for (const observation of options.observations ?? []) {
      this.setObservation(observation);
    }
  }

  getWatchFolder(watchFolderId: string): StoredCanonicalWatchFolder | undefined {
    const watchFolder = this.watchFolders.get(watchFolderId);
    return watchFolder ? { ...watchFolder } : undefined;
  }

  getWatchFolderByName(watchFolderName: string): StoredCanonicalWatchFolder | undefined {
    const watchFolderId = this.byName.get(watchFolderName);
    if (!watchFolderId) return undefined;
    return this.getWatchFolder(watchFolderId);
  }

  setWatchFolder(watchFolder: StoredCanonicalWatchFolder): void {
    this.watchFolders.set(watchFolder.watchFolderId, { ...watchFolder });
    this.byName.set(watchFolder.watchFolderName, watchFolder.watchFolderId);
  }

  removeWatchFolder(watchFolderId: string): void {
    const existing = this.watchFolders.get(watchFolderId);
    if (existing) {
      this.byName.delete(existing.watchFolderName);
      this.watchFolders.delete(watchFolderId);
    }
  }

  listWatchFolders(): readonly StoredCanonicalWatchFolder[] {
    return Array.from(this.watchFolders.values()).map((watchFolder) => ({ ...watchFolder }));
  }

  getSession(sessionId: string): StoredCanonicalWatchFolderSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  setSession(session: StoredCanonicalWatchFolderSession): void {
    this.sessions.set(session.sessionId, { ...session });
  }

  listSessions(watchFolderId?: string): readonly StoredCanonicalWatchFolderSession[] {
    const all = Array.from(this.sessions.values()).map((session) => ({ ...session }));
    if (!watchFolderId) return all;
    return all.filter((session) => session.watchFolderId === watchFolderId);
  }

  getObservation(observationId: string): StoredCanonicalWatchFolderObservation | undefined {
    const observation = this.observations.get(observationId);
    return observation ? { ...observation } : undefined;
  }

  setObservation(observation: StoredCanonicalWatchFolderObservation): void {
    this.observations.set(observation.observationId, { ...observation });
  }

  listObservations(watchFolderId?: string): readonly StoredCanonicalWatchFolderObservation[] {
    const all = Array.from(this.observations.values()).map((observation) => ({
      ...observation,
    }));
    if (!watchFolderId) return all;
    return all.filter((observation) => observation.watchFolderId === watchFolderId);
  }

  watchFolderCount(): number {
    return this.watchFolders.size;
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  observationCount(): number {
    return this.observations.size;
  }

  statistics(): CanonicalWatchFolderStatistics {
    const all = this.listWatchFolders();
    let registered = 0;
    let discovered = 0;
    for (const watchFolder of all) {
      if (watchFolder.status === "registered") registered += 1;
      if (watchFolder.discovered || watchFolder.status === "discovered") discovered += 1;
    }
    const sessions = this.listSessions();
    let openSessions = 0;
    let closedSessions = 0;
    for (const session of sessions) {
      if (session.status === "session-open") openSessions += 1;
      if (session.status === "session-closed") closedSessions += 1;
    }
    return {
      kind: "canonical-watch-folder-statistics",
      totalWatchFolders: all.length,
      registeredWatchFolders: registered,
      discoveredWatchFolders: discovered,
      openSessions,
      closedSessions,
      totalObservations: this.observationCount(),
      localWatchImplementedCount: 0,
      networkWatchImplementedCount: 0,
      uncImplementedCount: 0,
      smbImplementedCount: 0,
      azureFilesImplementedCount: 0,
      pollingImplementedCount: 0,
      fileSystemWatcherImplementedCount: 0,
      recursiveWatchImplementedCount: 0,
      changeNotificationImplementedCount: 0,
      automaticImportImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Watch Folder Runtime store ready (${this.watchFolderCount()} watchFolders, ${this.sessionCount()} sessions, ${this.observationCount()} observations).`,
    };
  }
}
