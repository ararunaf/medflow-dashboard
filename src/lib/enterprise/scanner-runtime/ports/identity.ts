/**
 * Helpers de identidade — F3-CAP-01 Enterprise Scanner Runtime.
 *
 * Identity:
 *   Enterprise Scanner Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 */

export const SCANNER_RUNTIME_IDENTITY = {
  name: "Enterprise Scanner Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Scanner Runtime Foundation — vendor-agnostic structural runtime for future scanner providers (TWAIN/WIA/ISIS/network/virtual).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createScannerRuntimeRequestId(): string {
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
let scannerSeq = 0;
let sessionSeq = 0;
let acquisitionSeq = 0;

/** Gera id estrutural para resultados de Scanner Runtime canônico. */
export function createScannerResultId(prefix = "scanner-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para Scanners canônicos. */
export function createScannerId(prefix = "scanner"): string {
  scannerSeq += 1;
  return `${prefix}-${scannerSeq.toString(36)}`;
}

/** Gera id estrutural para sessões canônicas. */
export function createScannerSessionId(prefix = "scanner-session"): string {
  sessionSeq += 1;
  return `${prefix}-${sessionSeq.toString(36)}`;
}

/** Gera id estrutural para aquisições canônicas. */
export function createScannerAcquisitionId(prefix = "scanner-acq"): string {
  acquisitionSeq += 1;
  return `${prefix}-${acquisitionSeq.toString(36)}`;
}

export function resetScannerRuntimeIdSequences(): void {
  resultSeq = 0;
  scannerSeq = 0;
  sessionSeq = 0;
  acquisitionSeq = 0;
}
