/**
 * Helpers de identidade — F3-CAP-03 Enterprise Upload Runtime.
 *
 * Identity:
 *   Enterprise Upload Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 */

export const UPLOAD_RUNTIME_IDENTITY = {
  name: "Enterprise Upload Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Upload Runtime Foundation — vendor-agnostic structural runtime for future upload providers (web/desktop/mobile/API, multipart/chunked/resumable, Azure Blob/Supabase/S3/Drive/OneDrive/Dropbox).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createUploadRuntimeRequestId(): string {
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
let uploadSeq = 0;
let sessionSeq = 0;
let receiptSeq = 0;

/** Gera id estrutural para resultados de Upload Runtime canônico. */
export function createUploadResultId(prefix = "upload-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para uploads canônicos. */
export function createUploadId(prefix = "upload"): string {
  uploadSeq += 1;
  return `${prefix}-${uploadSeq.toString(36)}`;
}

/** Gera id estrutural para sessões canônicas. */
export function createUploadSessionId(prefix = "upload-session"): string {
  sessionSeq += 1;
  return `${prefix}-${sessionSeq.toString(36)}`;
}

/** Gera id estrutural para receipts canônicos. */
export function createUploadReceiptId(prefix = "upload-receipt"): string {
  receiptSeq += 1;
  return `${prefix}-${receiptSeq.toString(36)}`;
}

export function resetUploadRuntimeIdSequences(): void {
  resultSeq = 0;
  uploadSeq = 0;
  sessionSeq = 0;
  receiptSeq = 0;
}
