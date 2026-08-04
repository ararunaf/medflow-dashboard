/**
 * Helpers de identidade — F3-CAP-04 Enterprise Intelligent Capture Runtime.
 *
 * Identity:
 *   Enterprise Intelligent Capture Runtime
 *   Foundation
 *   Version
 *   Vendor Agnostic
 */

export const INTELLIGENT_CAPTURE_RUNTIME_IDENTITY = {
  name: "Enterprise Intelligent Capture Runtime",
  layer: "Foundation",
  version: "1.0.0",
  vendorAgnostic: true as const,
  vendor: "medicflow-enterprise",
  description:
    "Enterprise Intelligent Capture Runtime Foundation — vendor-agnostic structural orchestration entrypoint for Scanner Runtime, Watch Folder Runtime and Upload Runtime (no OCR, no AI, no automatic capture, no document processing).",
} as const;

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createIntelligentCaptureRuntimeRequestId(): string {
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
let sourceSeq = 0;
let requestSeq = 0;
let routeSeq = 0;
let envelopeSeq = 0;

/** Gera id estrutural para resultados canônicos. */
export function createCaptureResultId(prefix = "capture-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para CaptureSource. */
export function createCaptureSourceId(prefix = "capture-source"): string {
  sourceSeq += 1;
  return `${prefix}-${sourceSeq.toString(36)}`;
}

/** Gera id estrutural para CaptureRequest. */
export function createCaptureRequestId(prefix = "capture-request"): string {
  requestSeq += 1;
  return `${prefix}-${requestSeq.toString(36)}`;
}

/** Gera id estrutural para CaptureRoute. */
export function createCaptureRouteId(prefix = "capture-route"): string {
  routeSeq += 1;
  return `${prefix}-${routeSeq.toString(36)}`;
}

/** Gera id estrutural para CaptureEnvelope. */
export function createCaptureEnvelopeId(prefix = "capture-envelope"): string {
  envelopeSeq += 1;
  return `${prefix}-${envelopeSeq.toString(36)}`;
}

export function resetIntelligentCaptureRuntimeIdSequences(): void {
  resultSeq = 0;
  sourceSeq = 0;
  requestSeq = 0;
  routeSeq = 0;
  envelopeSeq = 0;
}
