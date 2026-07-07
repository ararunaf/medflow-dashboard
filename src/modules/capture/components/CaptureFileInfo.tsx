import { formatFileSize, mimeTypeLabel } from "../utils/file-format";
import type { CaptureFileInfo } from "../types";

export function CaptureFileInfoPanel({ file }: { file: CaptureFileInfo | null }) {
  if (!file) return null;

  return (
    <dl className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Nome</dt>
      <dd className="font-medium truncate">{file.name}</dd>
      <dt className="text-muted-foreground">Tipo</dt>
      <dd>{mimeTypeLabel(file.mimeType)}</dd>
      <dt className="text-muted-foreground">Tamanho</dt>
      <dd>{formatFileSize(file.byteLength)}</dd>
      <dt className="text-muted-foreground">Versão</dt>
      <dd>v{file.version}</dd>
      {file.checksumSha256 ? (
        <>
          <dt className="text-muted-foreground col-span-2">Checksum SHA-256</dt>
          <dd className="col-span-2 font-mono text-xs break-all text-muted-foreground">
            {file.checksumSha256}
          </dd>
        </>
      ) : null}
    </dl>
  );
}
