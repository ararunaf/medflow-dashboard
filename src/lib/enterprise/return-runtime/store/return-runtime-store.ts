/**
 * ReturnRuntimeStore — contrato interno do store (C-08).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO processa retorno; NÃO correlaciona.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  ReturnContext,
  ReturnCorrelation,
  ReturnManifest,
  ReturnStatistics,
} from "../ports/canonical";

export type StoredReturnManifest = ReturnManifest;
export type StoredReturnContext = ReturnContext;
export type StoredReturnCorrelation = ReturnCorrelation;

export interface ReturnRuntimeStore {
  readonly storeId: string;

  getManifest(returnId: string): StoredReturnManifest | undefined;
  setManifest(manifest: StoredReturnManifest): void;
  listManifests(): readonly StoredReturnManifest[];
  manifestCount(): number;

  getContext(contextId: string): StoredReturnContext | undefined;
  setContext(context: StoredReturnContext): void;
  listContexts(): readonly StoredReturnContext[];
  contextCount(): number;

  getCorrelation(correlationId: string): StoredReturnCorrelation | undefined;
  setCorrelation(correlation: StoredReturnCorrelation): void;
  listCorrelations(): readonly StoredReturnCorrelation[];
  correlationCount(): number;

  statistics(): ReturnStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
