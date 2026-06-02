/**
 * Host visual do toast bus.
 *
 * - Renderiza uma pilha de notificações fixas no canto superior em
 *   desktop e ancoradas ao topo em mobile (acima da bottom-nav).
 * - Não altera o `AppShell` nem a identidade visual: usa apenas
 *   tokens já presentes no design system (`bg-card`, `border-border`,
 *   `--success`, `--warning`, `--destructive`).
 * - Não interfere com o layout principal: posiciona-se via `fixed`
 *   com `z-50` e `pointer-events-none`, cada toast individual
 *   recupera os pointer events.
 */
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToasts } from "@/hooks/use-toast";
import { toast as toastApi, type Toast, type ToastKind } from "@/lib/toast/bus";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const KIND_STYLES: Record<ToastKind, { ring: string; icon: string }> = {
  success: {
    ring: "border-[color:var(--success)]/30",
    icon: "text-[color:var(--success)]",
  },
  info: {
    ring: "border-[color:var(--secondary)]/30",
    icon: "text-[color:var(--secondary)]",
  },
  warning: {
    ring: "border-[color:var(--warning)]/30",
    icon: "text-[color:var(--warning)]",
  },
  error: {
    ring: "border-destructive/30",
    icon: "text-destructive",
  },
};

export function ToastHost() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3",
        "lg:left-auto lg:right-4 lg:top-4 lg:items-end lg:px-0",
      )}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const Icon = KIND_ICON[toast.kind];
  const styles = KIND_STYLES[toast.kind];

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-xl border bg-card/95 backdrop-blur",
        "ring-soft shadow-md transition-all",
        styles.ring,
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          className={cn(
            "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted",
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toastApi.dismiss(toast.id)}
          className="text-muted-foreground/70 hover:text-foreground transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
