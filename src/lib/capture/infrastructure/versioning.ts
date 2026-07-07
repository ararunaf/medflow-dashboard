/**
 * Paths versionados para clinical-documents.
 */
export function buildVersionedObjectKey(
  tenantId: string,
  captureId: string,
  filename: string,
  version: number,
): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
  const suffix = version > 1 ? `_v${version}` : "";
  const dot = safeName.lastIndexOf(".");
  if (dot > 0) {
    const base = safeName.slice(0, dot);
    const ext = safeName.slice(dot);
    return `${tenantId}/${captureId}/original/${base}${suffix}${ext}`;
  }
  return `${tenantId}/${captureId}/original/${safeName}${suffix}`;
}

export function nextDocumentVersion(metadata: Record<string, unknown> | null | undefined): number {
  const current = typeof metadata?.documentVersion === "number" ? metadata.documentVersion : 0;
  return current + 1;
}
