/** Formata tamanho de arquivo para exibição. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Label amigável para MIME type clínico. */
export function mimeTypeLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/tiff": "TIFF",
  };
  return map[mimeType] ?? mimeType;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createLocalPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeLocalPreviewUrl(url: string): void {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
