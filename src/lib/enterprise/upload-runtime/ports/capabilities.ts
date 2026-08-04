/**
 * UploadRuntimeCapabilities — capacidades declarativas (F3-CAP-03).
 *
 * Apenas declaração estrutural. Sem Upload real.
 * Sem Upload Web/Desktop/Mobile/API. Sem Multipart/Chunked/Resumable.
 * Sem Azure Blob/Supabase/S3/Google Drive/OneDrive/Dropbox.
 * Sem HTTP upload. Sem leitura de arquivos. Sem OCR. Sem filas. Sem processamento.
 */

import type { CanonicalUploadCapabilities } from "./canonical";

export type UploadRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsDiscover?: boolean;
  supportsOpenSession?: boolean;
  supportsCloseSession?: boolean;
  supportsReceive?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalUpload?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesCaptureEngineRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  runtimeReady?: true;
  webUploadImplemented?: false;
  desktopUploadImplemented?: false;
  mobileUploadImplemented?: false;
  apiUploadImplemented?: false;
  multipartImplemented?: false;
  chunkedUploadImplemented?: false;
  resumableUploadImplemented?: false;
  azureBlobImplemented?: false;
  supabaseStorageImplemented?: false;
  s3Implemented?: false;
  googleDriveImplemented?: false;
  oneDriveImplemented?: false;
  dropboxImplemented?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyUploadRuntimeCapabilities(): UploadRuntimeCapabilities {
  return {};
}

export function defineUploadRuntimeCapabilities(
  capabilities: UploadRuntimeCapabilities = {},
): UploadRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_UPLOAD_RUNTIME_CAPABILITIES: UploadRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsDiscover: true,
  supportsOpenSession: true,
  supportsCloseSession: true,
  supportsReceive: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalUpload: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesScannerRuntimePort: true,
  usesWatchFolderRuntimePort: true,
  usesCaptureEngineRuntimePort: true,
  usesOCRRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesObservabilityRuntimePort: true,
  runtimeReady: true,
  webUploadImplemented: false,
  desktopUploadImplemented: false,
  mobileUploadImplemented: false,
  apiUploadImplemented: false,
  multipartImplemented: false,
  chunkedUploadImplemented: false,
  resumableUploadImplemented: false,
  azureBlobImplemented: false,
  supabaseStorageImplemented: false,
  s3Implemented: false,
  googleDriveImplemented: false,
  oneDriveImplemented: false,
  dropboxImplemented: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES: UploadRuntimeCapabilities = {
  ...DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
};

export function toCanonicalUploadCapabilities(
  capabilities: UploadRuntimeCapabilities = DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
): CanonicalUploadCapabilities {
  return {
    kind: "canonical-upload-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsDiscover: capabilities.supportsDiscover === true,
    supportsOpenSession: capabilities.supportsOpenSession === true,
    supportsCloseSession: capabilities.supportsCloseSession === true,
    supportsReceive: capabilities.supportsReceive === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalUpload: capabilities.supportsCanonicalUpload === true,
    runtimeReady: true,
    webUploadImplemented: false,
    desktopUploadImplemented: false,
    mobileUploadImplemented: false,
    apiUploadImplemented: false,
    multipartImplemented: false,
    chunkedUploadImplemented: false,
    resumableUploadImplemented: false,
    azureBlobImplemented: false,
    supabaseStorageImplemented: false,
    s3Implemented: false,
    googleDriveImplemented: false,
    oneDriveImplemented: false,
    dropboxImplemented: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
