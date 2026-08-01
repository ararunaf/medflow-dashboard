/**
 * Utilitários de path e validação para clinical-documents.
 */
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  CAPTURE_ALLOWED_MIME_TYPES,
  CAPTURE_MAX_BYTES,
  CLINICAL_DOCUMENTS_BUCKET,
  type CaptureAllowedMimeType,
  type CaptureStoragePaths,
} from "../types";

export function buildCaptureStoragePaths(tenantId: string, captureId: string): CaptureStoragePaths {
  const base = `${tenantId}/${captureId}`;
  return {
    original: `${base}/original`,
    processed: `${base}/processed`,
    thumbnail: `${base}/thumbnail`,
    audit: `${base}/audit`,
  };
}

export function buildOriginalObjectKey(
  tenantId: string,
  captureId: string,
  filename: string,
): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  return `${tenantId}/${captureId}/original/${safeName}`;
}

export function buildAuditManifestKey(tenantId: string, captureId: string): string {
  return `${tenantId}/${captureId}/audit/manifest.json`;
}

export function validateCaptureUpload(input: {
  mimeType: string;
  byteLength: number;
  filename: string;
}): void {
  if (!CAPTURE_ALLOWED_MIME_TYPES.includes(input.mimeType as CaptureAllowedMimeType)) {
    throw new ValidationError(
      `Tipo de arquivo não permitido: ${input.mimeType}. Use PDF ou imagem.`,
      { mimeType: input.mimeType },
    );
  }
  if (input.byteLength <= 0 || input.byteLength > CAPTURE_MAX_BYTES) {
    throw new ValidationError(
      `Tamanho inválido (máx. ${Math.round(CAPTURE_MAX_BYTES / 1024 / 1024)}MB).`,
      { byteLength: input.byteLength },
    );
  }
  if (!input.filename.trim()) {
    throw new ValidationError("Nome do arquivo é obrigatório.", { field: "filename" });
  }
}

export { CLINICAL_DOCUMENTS_BUCKET };
