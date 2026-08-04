/**
 * IntelligentCaptureRuntimeStore — contrato interno do store (F3-CAP-04).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO captura; NÃO lê arquivos; NÃO roteia documentos.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CaptureEnvelope,
  CaptureRequest,
  CaptureRoute,
  CaptureSource,
  CanonicalCaptureStatistics,
} from "../ports/canonical";

export type StoredCaptureSource = CaptureSource;
export type StoredCaptureRequest = CaptureRequest;
export type StoredCaptureRoute = CaptureRoute;
export type StoredCaptureEnvelope = CaptureEnvelope;

export interface IntelligentCaptureRuntimeStore {
  readonly storeId: string;

  getSource(sourceId: string): StoredCaptureSource | undefined;
  getSourceByName(sourceName: string): StoredCaptureSource | undefined;
  setSource(source: StoredCaptureSource): void;
  removeSource(sourceId: string): void;
  listSources(): readonly StoredCaptureSource[];

  getRequest(requestId: string): StoredCaptureRequest | undefined;
  setRequest(request: StoredCaptureRequest): void;
  listRequests(sourceId?: string): readonly StoredCaptureRequest[];

  getRoute(routeId: string): StoredCaptureRoute | undefined;
  setRoute(route: StoredCaptureRoute): void;
  listRoutes(sourceId?: string): readonly StoredCaptureRoute[];

  getEnvelope(envelopeId: string): StoredCaptureEnvelope | undefined;
  setEnvelope(envelope: StoredCaptureEnvelope): void;
  listEnvelopes(sourceId?: string): readonly StoredCaptureEnvelope[];

  sourceCount(): number;
  requestCount(): number;
  routeCount(): number;
  envelopeCount(): number;
  statistics(): CanonicalCaptureStatistics;
  health(): { ok: boolean; message?: string };
}
