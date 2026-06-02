import { OPERATIONAL_UPLOAD_MAX_BYTES } from "@/lib/operational/constants";

const ALLOWED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_EXT = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

export type UploadValidationResult = { ok: true } | { ok: false; reason: string };

export function validateBrandingUpload(file: {
  name: string;
  size: number;
  type?: string;
}): UploadValidationResult {
  if (file.size <= 0) {
    return { ok: false, reason: "Arquivo vazio." };
  }
  if (file.size > OPERATIONAL_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      reason: `Tamanho máximo ${Math.round(OPERATIONAL_UPLOAD_MAX_BYTES / 1000)}KB.`,
    };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, reason: "Use PNG, JPEG, WebP ou SVG." };
  }
  if (file.type && !ALLOWED_IMAGE_MIME.has(file.type.toLowerCase())) {
    return { ok: false, reason: "Tipo MIME não permitido para branding." };
  }
  return { ok: true };
}
