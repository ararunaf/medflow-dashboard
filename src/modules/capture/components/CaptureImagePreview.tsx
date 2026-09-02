import { Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export type ImagePreviewHighlight = {
  /** Coordenadas normalizadas 0–1 relativas à página (StructuredFieldPosition.normalized). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Página do campo (1-based) — a prévia hoje só mostra uma página; ver nota abaixo se != 1. */
  page: number;
  /** true quando o achado selecionado é bloqueante — muda a cor do realce. */
  blocking?: boolean;
};

type CaptureImagePreviewProps = {
  src: string | null;
  alt: string;
  mimeType?: string;
  onDownload?: () => void;
  highlight?: ImagePreviewHighlight | null;
};

export function CaptureImagePreview({
  src,
  alt,
  mimeType,
  onDownload,
  highlight,
}: CaptureImagePreviewProps) {
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomOut}
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={zoomIn}
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={rotate}
                aria-label="Girar imagem"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          {onDownload ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDownload}
              aria-label="Baixar documento"
            >
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
            <div
              className="relative inline-block transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img src={src} alt={alt} className="block max-w-full" />
              {highlight && highlight.page === 1 ? (
                <div
                  className={`pointer-events-none absolute rounded-sm border-2 ring-2 ring-offset-1 ${
                    highlight.blocking
                      ? "border-destructive ring-destructive/40"
                      : "border-primary ring-primary/40"
                  }`}
                  style={{
                    left: `${highlight.x * 100}%`,
                    top: `${highlight.y * 100}%`,
                    width: `${highlight.width * 100}%`,
                    height: `${highlight.height * 100}%`,
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
      {highlight && highlight.page !== 1 ? (
        <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
          Campo do achado selecionado está na página {highlight.page} — esta prévia mostra só a
          primeira página.
        </p>
      ) : null}
    </div>
  );
}
