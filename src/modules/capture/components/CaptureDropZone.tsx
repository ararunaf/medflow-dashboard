import { Camera, FileUp, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

type CaptureDropZoneProps = {
  busy: boolean;
  dragOver: boolean;
  filename: string | null;
  onDragOver: (over: boolean) => void;
  onFiles: (files: FileList | null, channel: "file_upload" | "mobile_camera") => void;
};

export function CaptureDropZone({
  busy,
  dragOver,
  filename,
  onDragOver,
  onFiles,
}: CaptureDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(true);
      }}
      onDragLeave={() => onDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDragOver(false);
        onFiles(e.dataTransfer.files, "file_upload");
      }}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">Arraste arquivos aqui</p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, JPEG, PNG, WebP ou TIFF — até 25 MB
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          variant="default"
          disabled={busy}
          className="gap-2"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Tirar Foto
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="h-4 w-4" />
          Enviar Arquivo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff"
        className="hidden"
        onChange={(e) => onFiles(e.target.files, "file_upload")}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFiles(e.target.files, "mobile_camera");
        }}
      />

      {busy ? (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enviando…
        </p>
      ) : null}
      {filename ? (
        <p className="mt-2 text-xs text-muted-foreground truncate max-w-md mx-auto">
          Arquivo: {filename}
        </p>
      ) : null}
    </div>
  );
}
