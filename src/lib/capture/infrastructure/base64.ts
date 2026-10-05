import { ValidationError } from "@/lib/domain/operations/errors";

/** Decodifica base64 para bytes — funciona em Node (SSR) e browser. */
export function decodeBase64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Valida o conteúdo base64 de um arquivo enviado. NÃO passa por
 * sanitizeString (requireString), que corta em 8.192 caracteres — isso
 * gravava todo upload pela UI truncado em 6.144 bytes, com o cabeçalho
 * intacto (passava na checagem de magic-bytes) e o resto da imagem perdido.
 * Arquivo acima do limite é recusado, nunca cortado.
 */
export function requireBase64Content(value: unknown, field: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`Campo ${field} é obrigatório.`, { field });
  }
  const compact = value.replace(/\s+/g, "");
  if (compact.length % 4 !== 0 || !BASE64_RE.test(compact)) {
    throw new ValidationError(`Campo ${field} não é base64 válido.`, { field });
  }
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
  const decodedBytes = (compact.length / 4) * 3 - padding;
  if (decodedBytes > maxBytes) {
    throw new ValidationError(
      `Arquivo excede o limite de ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      { field, bytes: decodedBytes, maxBytes },
    );
  }
  return compact;
}
