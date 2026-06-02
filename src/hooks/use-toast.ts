/**
 * Hook React para consumir o toast bus operacional.
 *
 * - `useToasts()` retorna a lista atual via `useSyncExternalStore`,
 *   evitando re-renders desnecessários e funcionando com hidratação SSR
 *   (sempre devolve `[]` no servidor).
 * - `useToast()` retorna helpers já memoizados (`success`, `info`, …).
 */
import { useSyncExternalStore } from "react";
import { toast, toastBus, type Toast } from "@/lib/toast/bus";

const EMPTY: readonly Toast[] = Object.freeze([]);

export function useToasts(): readonly Toast[] {
  return useSyncExternalStore(toastBus.subscribe, toastBus.getSnapshot, () => EMPTY);
}

export function useToast() {
  return toast;
}
