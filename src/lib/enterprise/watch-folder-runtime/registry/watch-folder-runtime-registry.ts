/**
 * WatchFolderRuntimeRegistry — catálogo de mecanismos (F3-CAP-02).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem Scanner real. Sem FileSystemWatcher.
 */
import {
  DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
  DEFAULT_WATCH_FOLDER_RUNTIME_VERSION,
} from "../adapters/default-watch-folder-runtime-adapter";
import {
  DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION,
  MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-watch-folder-runtime-adapter";
import {
  DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  type WatchFolderRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  WatchFolderRuntimeProviderId,
  WatchFolderRuntimeRegistration,
  WatchFolderRuntimeStatus,
} from "../ports/types";

export type WatchFolderRuntimeRegistrySnapshot = {
  registrations: readonly WatchFolderRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly WatchFolderRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Watch Folder Runtime",
    version: DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Watch Folder Runtime mock — no real watchFolder, no Local/Network/UNC/SMB/Azure Files, no FileSystemWatcher.",
  },
  {
    providerId: "test",
    name: "Test Watch Folder Runtime",
    version: DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Watch Folder Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Watch Folder Runtime",
    version: DEFAULT_WATCH_FOLDER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Watch Folder Runtime",
    version: DEFAULT_WATCH_FOLDER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
    description:
      "Official F3-CAP-02 Enterprise Watch Folder Runtime — vendor-agnostic foundation only.",
  },
];

export class WatchFolderRuntimeRegistry {
  private readonly byId = new Map<WatchFolderRuntimeProviderId, WatchFolderRuntimeRegistration>();

  constructor(seed: readonly WatchFolderRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: WatchFolderRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: WatchFolderRuntimeProviderId): WatchFolderRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: WatchFolderRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly WatchFolderRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: WatchFolderRuntimeStatus): readonly WatchFolderRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: WatchFolderRuntimeProviderId): WatchFolderRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): WatchFolderRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultWatchFolderRuntimeRegistry(): WatchFolderRuntimeRegistry {
  return new WatchFolderRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_WATCH_FOLDER_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
