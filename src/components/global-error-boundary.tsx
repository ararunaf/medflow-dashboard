import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { classifyError } from "@/lib/errors/classify";
import { logClient } from "@/lib/monitoring/channels/client";

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Captura erros de renderização abaixo da árvore principal (complementa o errorComponent de rotas).
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logClient("react_error_boundary", {
      err: error,
      metadata: { component_stack: info.componentStack },
    });
  }

  render(): ReactNode {
    if (this.state.error) {
      const { message, kind } = classifyError(this.state.error);
      const isOffline = kind === "offline";
      return (
        <div className="min-h-[40vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 shadow-md ring-soft text-center">
            <div
              className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full ${
                isOffline
                  ? "bg-[color:var(--warning)]/15 text-[color:var(--warning)]"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              {isOffline ? "Você está offline" : "Algo saiu do esperado"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={() => this.setState({ error: null })}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar de novo
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Início
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
