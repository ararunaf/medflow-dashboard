/**
 * Helpers de identidade — F3-CAP-02 Enterprise Watch Folder Runtime.
 *
 * Identity:
 *   Enterprise Watch Folder Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 */

export const WATCH_FOLDER_RUNTIME_IDENTITY = {
  name: "Enterprise Watch Folder Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Watch Folder Runtime Foundation — vendor-agnostic structural runtime for future watch folder providers (local/network/UNC/SMB/NAS/Azure Files).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createWatchFolderRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let resultSeq = 0;
let watchFolderSeq = 0;
let sessionSeq = 0;
let observationSeq = 0;

/** Gera id estrutural para resultados de Watch Folder Runtime canônico. */
export function createWatchFolderResultId(prefix = "watch-folder-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para Watch Folders canônicos. */
export function createWatchFolderId(prefix = "watch-folder"): string {
  watchFolderSeq += 1;
  return `${prefix}-${watchFolderSeq.toString(36)}`;
}

/** Gera id estrutural para sessões canônicas. */
export function createWatchFolderSessionId(prefix = "watch-folder-session"): string {
  sessionSeq += 1;
  return `${prefix}-${sessionSeq.toString(36)}`;
}

/** Gera id estrutural para observações canônicas. */
export function createWatchFolderObservationId(prefix = "watch-folder-obs"): string {
  observationSeq += 1;
  return `${prefix}-${observationSeq.toString(36)}`;
}

export function resetWatchFolderRuntimeIdSequences(): void {
  resultSeq = 0;
  watchFolderSeq = 0;
  sessionSeq = 0;
  observationSeq = 0;
}
