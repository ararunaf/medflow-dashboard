import { Download, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, type ReactNode } from "react";

export function ImageLightbox(props: {
  open: boolean;
  src: string;
  alt: string;
  downloadName: string;
  onClose: () => void;
}) {
  const { open, src, alt, downloadName, onClose } = props;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-sm font-medium text-white truncate">{alt}</span>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={src}
            download={downloadName}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button
        type="button"
        className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0 cursor-zoom-out"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </button>
    </div>
  );
}

export function ImagePreviewCard(props: {
  src: string;
  alt: string;
  downloadName: string;
  onExpand: () => void;
}) {
  const { src, alt, downloadName, onExpand } = props;

  return (
    <div className="relative group rounded-xl border border-border bg-muted/20 overflow-hidden">
      <button
        type="button"
        onClick={onExpand}
        className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Ampliar ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain max-h-[420px] mx-auto"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
            <ZoomIn className="h-3.5 w-3.5" />
            Clique para ampliar
          </span>
        </div>
      </button>
      <div className="flex flex-wrap gap-2 p-3 border-t border-border bg-card">
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          Ampliar
        </button>
        <a
          href={src}
          download={downloadName}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </div>
  );
}

export function HelpSection(props: {
  id?: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "default" | "violet";
}) {
  const accentClass =
    props.accent === "violet"
      ? "border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] via-card to-card"
      : "border-border bg-card";

  return (
    <section
      id={props.id}
      className={`rounded-xl border ${accentClass} ring-soft p-5 sm:p-6 scroll-mt-24`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">{props.icon}</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{props.title}</h2>
          {props.subtitle ? (
            <p className="text-xs text-muted-foreground mt-0.5">{props.subtitle}</p>
          ) : null}
        </div>
      </div>
      {props.children}
    </section>
  );
}
