/**
 * Normalização de imagem antes do envio da guia (fotos de iPhone e afins).
 *
 * - HEIC/HEIF (padrão do iPhone) → JPEG. O Safari decodifica nativamente; nos
 *   demais navegadores o decodificador (heic-to, libheif) é carregado sob
 *   demanda, só quando aparece um HEIC.
 * - Rotação EXIF aplicada aos pixels: a guia chega "em pé" no OCR, o que o
 *   parser geométrico (valor abaixo do rótulo) exige.
 * - Lado maior limitado e JPEG recomprimido: o Azure Document Intelligence no
 *   plano F0 recusa arquivos acima de 4 MB.
 *
 * PDF, TIFF e imagens já pequenas e em pé seguem sem alteração. O servidor
 * continua aceitando só PDF/JPEG/PNG/WebP/TIFF — quem converte é o navegador.
 */

export const NORMALIZE_MAX_EDGE = 2800;
/** Margem abaixo dos 4 MB do Azure F0. */
export const NORMALIZE_TARGET_BYTES = 3.5 * 1024 * 1024;
const JPEG_QUALITIES = [0.85, 0.75, 0.65] as const;

export type SniffedFormat = "pdf" | "jpeg" | "png" | "webp" | "tiff" | "heic" | null;

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** Formato real pelos bytes iniciais — o `file.type` do HEIC vem vazio em vários navegadores. */
export function sniffImageFormat(bytes: Uint8Array): SniffedFormat {
  if (bytes.length < 12) return null;
  if (ascii(bytes, 0, 5) === "%PDF-") return "pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG") return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 0, 4) === "II*\0" || ascii(bytes, 0, 4) === "MM\0*") return "tiff";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const major = ascii(bytes, 8, 4);
    if (HEIC_BRANDS.has(major)) return "heic";
    // Marcas compatíveis listadas depois do minor version.
    const boxSize = (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!;
    for (let i = 16; i + 4 <= Math.min(boxSize, bytes.length); i += 4) {
      if (HEIC_BRANDS.has(ascii(bytes, i, 4))) return "heic";
    }
  }
  return null;
}

/** Orientação EXIF (1–8) de um JPEG; 1 quando não há tag ou o arquivo não é JPEG. */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1]!;
    const size = view.getUint16(offset + 2);
    if (marker === 0xe1 && ascii(bytes, offset + 4, 6) === "Exif\0\0") {
      const tiff = offset + 10;
      if (tiff + 8 > bytes.length) return 1;
      const little = ascii(bytes, tiff, 2) === "II";
      const ifd = tiff + view.getUint32(tiff + 4, little);
      if (ifd + 2 > bytes.length) return 1;
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 12 > bytes.length) return 1;
        if (view.getUint16(entry, little) === 0x0112) {
          const value = view.getUint16(entry + 8, little);
          return value >= 1 && value <= 8 ? value : 1;
        }
      }
      return 1;
    }
    if (marker === 0xda) return 1; // início dos dados da imagem — sem EXIF antes disso
    offset += 2 + size;
  }
  return 1;
}

/** Dimensões finais mantendo a proporção, com o lado maior ≤ maxEdge. */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Decide se a imagem precisa passar pela conversão (sem decodificar). */
export function needsNormalization(input: {
  format: SniffedFormat;
  byteLength: number;
  orientation: number;
}): boolean {
  if (input.format === "heic") return true;
  if (input.format === "jpeg" || input.format === "png" || input.format === "webp") {
    return input.byteLength > NORMALIZE_TARGET_BYTES || input.orientation !== 1;
  }
  return false; // PDF, TIFF e desconhecidos seguem como vieram (o servidor valida)
}

export function toJpegName(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "") || "guia";
  return `${base}.jpg`;
}

export type NormalizedCaptureFile = {
  file: File;
  converted: boolean;
  /** Ex.: "HEIC convertida para JPEG · 4032×3024 → 2800×2100". */
  note?: string;
};

async function decodeToBitmap(file: File, format: SniffedFormat): Promise<ImageBitmap> {
  try {
    // Safari decodifica HEIC; todos aplicam a rotação EXIF com "from-image".
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (nativeErr) {
    if (format !== "heic") throw nativeErr;
    const { heicTo } = await import("heic-to/csp");
    return heicTo({ blob: file, type: "bitmap" });
  }
}

function canvasToJpeg(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas indisponível neste navegador."));
  context.fillStyle = "#ffffff"; // PNG com transparência vira fundo branco, não preto
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar o JPEG."))),
      "image/jpeg",
      quality,
    ),
  );
}

export async function normalizeCaptureFile(file: File): Promise<NormalizedCaptureFile> {
  const head = new Uint8Array(await file.slice(0, 128 * 1024).arrayBuffer());
  const format = sniffImageFormat(head);
  const orientation = format === "jpeg" ? readJpegOrientation(head) : 1;
  if (!needsNormalization({ format, byteLength: file.size, orientation })) {
    return { file, converted: false };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeToBitmap(file, format);
  } catch {
    throw new Error(
      format === "heic"
        ? "Não foi possível abrir a foto HEIC neste navegador. No iPhone, em Ajustes › Câmera › Formatos, escolha “Mais Compatível” e fotografe de novo — ou envie pelo próprio iPhone."
        : "Não foi possível abrir a imagem para prepará-la. Tente outra foto ou envie em PDF.",
    );
  }

  try {
    let edge = NORMALIZE_MAX_EDGE;
    let blob: Blob | null = null;
    let size = fitWithin(bitmap.width, bitmap.height, edge);
    for (let attempt = 0; attempt < 2 && !blob; attempt++) {
      size = fitWithin(bitmap.width, bitmap.height, edge);
      for (const quality of JPEG_QUALITIES) {
        const candidate = await canvasToJpeg(bitmap, size.width, size.height, quality);
        if (candidate.size <= NORMALIZE_TARGET_BYTES) {
          blob = candidate;
          break;
        }
      }
      edge = 2200;
    }
    if (!blob) throw new Error("A foto continua grande demais mesmo reduzida. Envie em PDF.");

    const from = `${bitmap.width}×${bitmap.height}`;
    const to = `${size.width}×${size.height}`;
    const what = format === "heic" ? "Foto HEIC convertida para JPEG" : "Foto ajustada para o OCR";
    return {
      file: new File([blob], toJpegName(file.name), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }),
      converted: true,
      note: from === to ? what : `${what} · ${from} → ${to}`,
    };
  } finally {
    bitmap.close();
  }
}
