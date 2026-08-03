/**
 * ObservabilityRuntimeStore — contrato interno do store (INF-09).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO emite telemetria; NÃO gera logs/métricas/tracing reais.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalObservabilityScope,
  CanonicalObservabilityEnvelope,
  CanonicalObservabilitySignal,
  CanonicalObservabilityStatistics,
} from "../ports/canonical";

export type StoredCanonicalObservabilityScope = CanonicalObservabilityScope;
export type StoredCanonicalObservabilitySignal = CanonicalObservabilitySignal;
export type StoredCanonicalObservabilityEnvelope = CanonicalObservabilityEnvelope;

export interface ObservabilityRuntimeStore {
  readonly storeId: string;

  getScope(scopeId: string): StoredCanonicalObservabilityScope | undefined;
  getScopeByName(scopeName: string): StoredCanonicalObservabilityScope | undefined;
  setScope(scope: StoredCanonicalObservabilityScope): void;
  removeScope(scopeId: string): void;
  listScopes(): readonly StoredCanonicalObservabilityScope[];

  getSignal(signalId: string): StoredCanonicalObservabilitySignal | undefined;
  setSignal(signal: StoredCanonicalObservabilitySignal): void;
  listSignals(scopeId?: string): readonly StoredCanonicalObservabilitySignal[];

  getEnvelope(envelopeId: string): StoredCanonicalObservabilityEnvelope | undefined;
  setEnvelope(envelope: StoredCanonicalObservabilityEnvelope): void;
  listEnvelopes(scopeId?: string): readonly StoredCanonicalObservabilityEnvelope[];

  scopeCount(): number;
  signalCount(): number;
  envelopeCount(): number;
  statistics(): CanonicalObservabilityStatistics;
  health(): { ok: boolean; message?: string };
}
