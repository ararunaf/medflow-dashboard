import { Link } from "@tanstack/react-router";
import { LogIn, ShieldAlert } from "lucide-react";
import { LOGIN_REASON_MESSAGES } from "@/lib/errors/messages";
import type { AppErrorKind } from "@/lib/errors/types";

type AuthFallbackProps = {
  reason: AppErrorKind | null;
  /** Variante compacta (banner) ou página inteira. */
  variant?: "banner" | "page";
};

/**
 * Mensagem de auth na tela de login ou quando a sessão não é válida.
 */
export function AuthFallback({ reason, variant = "banner" }: AuthFallbackProps) {
  if (!reason || !(reason in LOGIN_REASON_MESSAGES)) return null;

  const message = LOGIN_REASON_MESSAGES[reason as keyof typeof LOGIN_REASON_MESSAGES]!;

  if (variant === "page") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-md ring-soft">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[color:var(--warning)]/15 text-[color:var(--warning)]">
            <ShieldAlert className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Acesso necessário</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link
            to="/login"
            search={{ reason }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-[color:var(--warning)]/50 bg-[color:var(--warning)]/10 px-3 py-2 text-sm text-foreground"
    >
      {message}
    </div>
  );
}
