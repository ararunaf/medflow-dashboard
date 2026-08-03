/**
 * ScalabilityRuntimeStore — contrato interno do store (INF-10).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO emite telemetria; NÃO gera logs/métricas/tracing reais.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalScalabilityScope,
  CanonicalScalabilityEnvelope,
  CanonicalScalabilitySignal,
  CanonicalScalabilityStatistics,
} from "../ports/canonical";

export type StoredCanonicalScalabilityScope = CanonicalScalabilityScope;
export type StoredCanonicalScalabilitySignal = CanonicalScalabilitySignal;
export type StoredCanonicalScalabilityEnvelope = CanonicalScalabilityEnvelope;

export interface ScalabilityRuntimeStore {
  readonly storeId: string;

  getScope(scopeId: string): StoredCanonicalScalabilityScope | undefined;
  getScopeByName(scopeName: string): StoredCanonicalScalabilityScope | undefined;
  setScope(scope: StoredCanonicalScalabilityScope): void;
  removeScope(scopeId: string): void;
  listScopes(): readonly StoredCanonicalScalabilityScope[];

  getSignal(signalId: string): StoredCanonicalScalabilitySignal | undefined;
  setSignal(signal: StoredCanonicalScalabilitySignal): void;
  listSignals(scopeId?: string): readonly StoredCanonicalScalabilitySignal[];

  getEnvelope(envelopeId: string): StoredCanonicalScalabilityEnvelope | undefined;
  setEnvelope(envelope: StoredCanonicalScalabilityEnvelope): void;
  listEnvelopes(scopeId?: string): readonly StoredCanonicalScalabilityEnvelope[];

  scopeCount(): number;
  signalCount(): number;
  envelopeCount(): number;
  statistics(): CanonicalScalabilityStatistics;
  health(): { ok: boolean; message?: string };
}
