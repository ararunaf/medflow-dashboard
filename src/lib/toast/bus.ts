/**
 * Toast bus operacional do MedFlow-IA.
 *
 * Pub/sub leve em memória, sem dependências externas:
 *  - emite notificações curtas para UX operacional (plantão confirmado,
 *    troca aprovada, nova solicitação, etc.);
 *  - é consumido pelo `<ToastHost />` via `useSyncExternalStore`;
 *  - sobrevive a re-renders e a reconexões realtime.
 *
 * Cada toast tem um `key` opcional usado para de-duplicar bursts
 * (ex.: duas invalidations rápidas do mesmo registro). Quando um
 * toast com a mesma `key` já está visível, o push é descartado
 * silenciosamente.
 */

export type ToastKind = "success" | "info" | "warning" | "error";

export type ToastInput = {
  kind: ToastKind;
  title: string;
  description?: string;
  /** Tempo total de vida em ms. Default 4500. `0` desativa o auto-dismiss. */
  ttlMs?: number;
  /** Chave de de-duplicação. Toasts ativos com mesma key são ignorados. */
  key?: string;
};

export type Toast = Required<Pick<ToastInput, "kind" | "title">> & {
  id: string;
  description?: string;
  ttlMs: number;
  key: string | null;
  createdAt: number;
};

const MAX_TOASTS = 4;
const DEFAULT_TTL_MS = 4500;

let counter = 0;
function nextId(): string {
  counter += 1;
  return `t_${Date.now().toString(36)}_${counter.toString(36)}`;
}

class ToastBus {
  private toasts: Toast[] = [];
  private listeners = new Set<() => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private cachedSnapshot: readonly Toast[] = [];

  getSnapshot = (): readonly Toast[] => this.cachedSnapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  push = (input: ToastInput): string | null => {
    const key = input.key ?? null;
    if (key && this.toasts.some((t) => t.key === key)) {
      return null;
    }

    const ttlMs = input.ttlMs ?? DEFAULT_TTL_MS;
    const toast: Toast = {
      id: nextId(),
      kind: input.kind,
      title: input.title,
      description: input.description,
      ttlMs,
      key,
      createdAt: Date.now(),
    };

    const next = [toast, ...this.toasts].slice(0, MAX_TOASTS);
    this.toasts = next;
    this.commit();

    if (ttlMs > 0 && typeof window !== "undefined") {
      const handle = setTimeout(() => this.dismiss(toast.id), ttlMs);
      this.timers.set(toast.id, handle);
    }
    return toast.id;
  };

  dismiss = (id: string): void => {
    const handle = this.timers.get(id);
    if (handle) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
    const next = this.toasts.filter((t) => t.id !== id);
    if (next.length === this.toasts.length) return;
    this.toasts = next;
    this.commit();
  };

  clear = (): void => {
    for (const handle of this.timers.values()) clearTimeout(handle);
    this.timers.clear();
    this.toasts = [];
    this.commit();
  };

  private commit() {
    this.cachedSnapshot = this.toasts.slice();
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        // ignore
      }
    }
  }
}

export const toastBus = new ToastBus();

/**
 * API utilitária — pode ser chamada de qualquer lugar (hooks, mutations,
 * handlers de realtime). É segura no servidor: o array é mantido em
 * memória, mas só renderiza no client onde o `<ToastHost />` está montado.
 */
export const toast = {
  show(input: ToastInput): string | null {
    return toastBus.push(input);
  },
  success(title: string, description?: string, key?: string): string | null {
    return toastBus.push({ kind: "success", title, description, key });
  },
  info(title: string, description?: string, key?: string): string | null {
    return toastBus.push({ kind: "info", title, description, key });
  },
  warning(title: string, description?: string, key?: string): string | null {
    return toastBus.push({ kind: "warning", title, description, key });
  },
  error(title: string, description?: string, key?: string): string | null {
    return toastBus.push({ kind: "error", title, description, key });
  },
  dismiss(id: string): void {
    toastBus.dismiss(id);
  },
  clear(): void {
    toastBus.clear();
  },
};
