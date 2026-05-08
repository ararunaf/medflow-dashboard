import type { ReactNode } from "react";
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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
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
      <div className={cn("mt-3 text-2xl font-semibold tracking-tight", toneMap[tone])}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
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
