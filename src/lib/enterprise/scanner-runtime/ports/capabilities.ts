/**
 * ScannerRuntimeCapabilities — capacidades declarativas (F3-CAP-01).
 *
 * Apenas declaração estrutural. Sem Scanner real. Sem TWAIN/WIA/ISIS.
 * Sem Drivers. Sem OCR. Sem Upload. Sem Watch Folder.
 */

import type { CanonicalScannerCapabilities } from "./canonical";

export type ScannerRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsDiscover?: boolean;
  supportsOpenSession?: boolean;
  supportsCloseSession?: boolean;
  supportsAcquire?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalScanner?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesCaptureEngineRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  usesTISSRuntimePort?: boolean;
  runtimeReady?: true;
  scannerImplemented?: false;
  twainImplemented?: false;
  wiaImplemented?: false;
  isisImplemented?: false;
  networkScannerImplemented?: false;
  driverImplemented?: false;
  captureImplemented?: false;
  implementsTwain?: false;
  implementsWia?: false;
  implementsIsis?: false;
  implementsUsb?: false;
  implementsNetworkScanner?: false;
  implementsWatchFolder?: false;
  implementsOcr?: false;
  implementsUpload?: false;
  implementsHttp?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyScannerRuntimeCapabilities(): ScannerRuntimeCapabilities {
  return {};
}

export function defineScannerRuntimeCapabilities(
  capabilities: ScannerRuntimeCapabilities = {},
): ScannerRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_SCANNER_RUNTIME_CAPABILITIES: ScannerRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsDiscover: true,
  supportsOpenSession: true,
  supportsCloseSession: true,
  supportsAcquire: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalScanner: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesCaptureEngineRuntimePort: true,
  usesOCRRuntimePort: true,
  usesQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesScalabilityRuntimePort: true,
  usesTISSRuntimePort: true,
  runtimeReady: true,
  scannerImplemented: false,
  twainImplemented: false,
  wiaImplemented: false,
  isisImplemented: false,
  networkScannerImplemented: false,
  driverImplemented: false,
  captureImplemented: false,
  implementsTwain: false,
  implementsWia: false,
  implementsIsis: false,
  implementsUsb: false,
  implementsNetworkScanner: false,
  implementsWatchFolder: false,
  implementsOcr: false,
  implementsUpload: false,
  implementsHttp: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES: ScannerRuntimeCapabilities = {
  ...DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
};

export function toCanonicalScannerCapabilities(
  capabilities: ScannerRuntimeCapabilities = DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
): CanonicalScannerCapabilities {
  return {
    kind: "canonical-scanner-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsDiscover: capabilities.supportsDiscover === true,
    supportsOpenSession: capabilities.supportsOpenSession === true,
    supportsCloseSession: capabilities.supportsCloseSession === true,
    supportsAcquire: capabilities.supportsAcquire === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalScanner: capabilities.supportsCanonicalScanner === true,
    runtimeReady: true,
    scannerImplemented: false,
    twainImplemented: false,
    wiaImplemented: false,
    isisImplemented: false,
    networkScannerImplemented: false,
    driverImplemented: false,
    captureImplemented: false,
    implementsTwain: false,
    implementsWia: false,
    implementsIsis: false,
    implementsUsb: false,
    implementsNetworkScanner: false,
    implementsWatchFolder: false,
    implementsOcr: false,
    implementsUpload: false,
    implementsHttp: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}
