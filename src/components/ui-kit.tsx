import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0 flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "primary";
}) {
  const toneMap = {
    default: "text-foreground",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
    primary: "text-primary",
  } as const;
  return (
    <div className="rounded-xl bg-card border border-border p-5 ring-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="h-8 w-8 grid place-items-center rounded-lg bg-muted text-primary">
            {icon}
          </span>
        )}
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tracking-tight", toneMap[tone])}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function SkeletonRow({ height = 56 }: { height?: number }) {
  return (
    <div
      className="rounded-xl bg-card border border-border ring-soft animate-pulse"
      style={{ height }}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <div className="font-medium">Não foi possível carregar.</div>
      <p className="mt-1 text-xs opacity-80">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center justify-center rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "confirmado" | "disponivel" | "pendente" | "trocar" | "cancelado";
}) {
  const map = {
    confirmado: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    disponivel: "bg-accent/20 text-primary",
    pendente: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    trocar: "bg-muted text-muted-foreground",
    cancelado: "bg-destructive/10 text-destructive",
  } as const;
  const label = {
    confirmado: "Confirmado",
    disponivel: "Disponível",
    pendente: "Pendente",
    trocar: "Em troca",
    cancelado: "Cancelado",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/**
 * Diálogo de confirmação reutilizável para ações irreversíveis/consequentes
 * (negar, rejeitar, cancelar). Segue o mesmo padrão de overlay/escape usado
 * nos drawers do app, mas centralizado e sem estado próprio de formulário.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  confirming = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card shadow-xl p-5">
        <h2 id="confirm-dialog-title" className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
              tone === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {confirming ? "Confirmando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
