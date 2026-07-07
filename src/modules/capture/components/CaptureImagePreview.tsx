import { Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

type CaptureImagePreviewProps = {
  src: string | null;
  alt: string;
  mimeType?: string;
  onDownload?: () => void;
};

export function CaptureImagePreview({ src, alt, mimeType, onDownload }: CaptureImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
  const rotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);

  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-muted/30">
        <p className="text-sm text-muted-foreground">Nenhuma imagem selecionada</p>
      </div>
    );
  }

  const isPdf = mimeType === "application/pdf";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium truncate">{alt}</span>
        <div className="flex items-center gap-1 shrink-0">
          {!isPdf ? (
            <>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          {onDownload ? (
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="overflow-auto max-h-[420px] p-4 bg-muted/20">
        {isPdf ? (
          <iframe
            src={src}
            title={alt}
            className="w-full h-[360px] rounded-lg border border-border bg-white"
          />
        ) : (
          <div className="flex min-h-[280px] items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-full transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
