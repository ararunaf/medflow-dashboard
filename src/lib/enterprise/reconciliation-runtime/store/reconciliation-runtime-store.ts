/**
 * ReconciliationRuntimeStore — contrato interno do store (C-09).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO reconcilia; NÃO faz matching.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalReconciliationResult,
  ReconciliationContext,
  ReconciliationCorrelation,
  ReconciliationManifest,
  ReconciliationStatistics,
} from "../ports/canonical";

export type StoredReconciliationManifest = ReconciliationManifest;
export type StoredReconciliationContext = ReconciliationContext;
export type StoredReconciliationCorrelation = ReconciliationCorrelation;
export type StoredCanonicalReconciliationResult = CanonicalReconciliationResult & {
  resultId?: string;
};

export interface ReconciliationRuntimeStore {
  readonly storeId: string;

  getManifest(reconciliationId: string): StoredReconciliationManifest | undefined;
  setManifest(manifest: StoredReconciliationManifest): void;
  listManifests(): readonly StoredReconciliationManifest[];
  manifestCount(): number;

  getContext(contextId: string): StoredReconciliationContext | undefined;
  setContext(context: StoredReconciliationContext): void;
  listContexts(): readonly StoredReconciliationContext[];
  contextCount(): number;

  getCorrelation(correlationId: string): StoredReconciliationCorrelation | undefined;
  setCorrelation(correlation: StoredReconciliationCorrelation): void;
  listCorrelations(): readonly StoredReconciliationCorrelation[];
  correlationCount(): number;

  getResult(resultId: string): StoredCanonicalReconciliationResult | undefined;
  setResult(result: StoredCanonicalReconciliationResult): void;
  listResults(): readonly StoredCanonicalReconciliationResult[];
  resultCount(): number;

  statistics(): ReconciliationStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
