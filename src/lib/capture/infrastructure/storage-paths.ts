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

/**
 * Assinatura binária (magic bytes) esperada por mime type — detecta arquivo
 * corrompido, truncado ou com Content-Type mentiroso antes de gravar no
 * datalake ou disparar o pipeline de OCR sobre um arquivo inválido.
 */
function hasMagicBytes(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

function matchesDeclaredMimeType(bytes: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case "application/pdf":
      // "%PDF-"
      return hasMagicBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "image/jpeg":
      return hasMagicBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return hasMagicBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      // "RIFF" .... "WEBP"
      return (
        hasMagicBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        hasMagicBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    case "image/tiff":
      // little-endian "II*\0" ou big-endian "MM\0*"
      return (
        hasMagicBytes(bytes, [0x49, 0x49, 0x2a, 0x00]) ||
        hasMagicBytes(bytes, [0x4d, 0x4d, 0x00, 0x2a])
      );
    default:
      return false;
  }
}

export function validateCaptureUpload(input: {
  mimeType: string;
  byteLength: number;
  filename: string;
  fileBytes: Uint8Array;
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
  if (input.fileBytes.length !== input.byteLength) {
    throw new ValidationError("Tamanho declarado não confere com o arquivo recebido.", {
      declared: input.byteLength,
      actual: input.fileBytes.length,
    });
  }
  if (!matchesDeclaredMimeType(input.fileBytes, input.mimeType)) {
    throw new ValidationError(
      `Conteúdo do arquivo não corresponde ao tipo declarado (${input.mimeType}) — possível arquivo corrompido ou Content-Type incorreto.`,
      { mimeType: input.mimeType },
    );
  }
}

export { CLINICAL_DOCUMENTS_BUCKET };
