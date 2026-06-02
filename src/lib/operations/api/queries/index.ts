/**
 * Ponto único de importação das server functions de LEITURA (queries).
 *
 *   import { listOpenShiftsFn } from "@/lib/operations/api/queries";
 *
 * Toda função retorna `QueryResult<T>` — o cliente faz unwrap em
 * `unwrap()` (em `src/lib/queries/result.ts`) para alimentar TanStack Query.
 */
export * from "./command-center";
export * from "./operational-analytics";
export * from "./dashboard";
export * from "./shifts";
export * from "./assignments";
export * from "./swaps";
export * from "./availability";
export * from "./profile";
export * from "./operational-action-proposals";
