/**
 * WatchFolderRuntimeCapabilities — capacidades declarativas (F3-CAP-02).
 *
 * Apenas declaração estrutural. Sem Watch Folder real.
 * Sem Local / Network / UNC / SMB / Azure Files.
 * Sem FileSystemWatcher. Sem Polling. Sem Importação automática. Sem monitoramento real.
 */

import type { CanonicalWatchFolderCapabilities } from "./canonical";

export type WatchFolderRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsDiscover?: boolean;
  supportsOpenSession?: boolean;
  supportsCloseSession?: boolean;
  supportsObserve?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalWatchFolder?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesScannerRuntimePort?: boolean;
  usesCaptureEngineRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  runtimeReady?: true;
  localWatchImplemented?: false;
  networkWatchImplemented?: false;
  uncImplemented?: false;
  smbImplemented?: false;
  azureFilesImplemented?: false;
  pollingImplemented?: false;
  fileSystemWatcherImplemented?: false;
  recursiveWatchImplemented?: false;
  changeNotificationImplemented?: false;
  automaticImportImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyWatchFolderRuntimeCapabilities(): WatchFolderRuntimeCapabilities {
  return {};
}

export function defineWatchFolderRuntimeCapabilities(
  capabilities: WatchFolderRuntimeCapabilities = {},
): WatchFolderRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES: WatchFolderRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsDiscover: true,
  supportsOpenSession: true,
  supportsCloseSession: true,
  supportsObserve: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalWatchFolder: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesScannerRuntimePort: true,
  usesCaptureEngineRuntimePort: true,
  usesOCRRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesObservabilityRuntimePort: true,
  runtimeReady: true,
  localWatchImplemented: false,
  networkWatchImplemented: false,
  uncImplemented: false,
  smbImplemented: false,
  azureFilesImplemented: false,
  pollingImplemented: false,
  fileSystemWatcherImplemented: false,
  recursiveWatchImplemented: false,
  changeNotificationImplemented: false,
  automaticImportImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_WATCH_FOLDER_RUNTIME_CAPABILITIES: WatchFolderRuntimeCapabilities = {
  ...DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
};

export function toCanonicalWatchFolderCapabilities(
  capabilities: WatchFolderRuntimeCapabilities = DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
): CanonicalWatchFolderCapabilities {
  return {
    kind: "canonical-watch-folder-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsDiscover: capabilities.supportsDiscover === true,
    supportsOpenSession: capabilities.supportsOpenSession === true,
    supportsCloseSession: capabilities.supportsCloseSession === true,
    supportsObserve: capabilities.supportsObserve === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalWatchFolder: capabilities.supportsCanonicalWatchFolder === true,
    runtimeReady: true,
    localWatchImplemented: false,
    networkWatchImplemented: false,
    uncImplemented: false,
    smbImplemented: false,
    azureFilesImplemented: false,
    pollingImplemented: false,
    fileSystemWatcherImplemented: false,
    recursiveWatchImplemented: false,
    changeNotificationImplemented: false,
    automaticImportImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
