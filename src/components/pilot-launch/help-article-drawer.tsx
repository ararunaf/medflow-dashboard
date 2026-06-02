import type { HelpCenterArticle } from "@/lib/services/help-center/help-center-service";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export function HelpArticleDrawer({
  open,
  article,
  onClose,
}: {
  open: boolean;
  article: HelpCenterArticle | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 motion-safe:transition-opacity"
        aria-label="Fechar"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col motion-safe:transition-transform duration-150">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {article.category === "faq"
                ? "FAQ"
                : article.category === "guide"
                  ? "Guia"
                  : article.category === "doc"
                    ? "Documentação"
                    : "Artigo"}
            </p>
            <h2 className="text-base font-semibold text-foreground mt-1 leading-snug">
              {article.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{article.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm text-foreground">
          {article.body.map((p, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
        {article.relatedRoute ? (
          <div className="px-5 py-4 border-t border-border">
            <Link
              to={article.relatedRoute}
              onClick={onClose}
              className="text-xs font-medium text-primary hover:underline"
            >
              Abrir tela relacionada →
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
