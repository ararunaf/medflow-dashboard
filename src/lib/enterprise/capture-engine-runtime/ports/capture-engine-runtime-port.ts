/**
 * CaptureEngineRuntimePort — contrato único do Capture Engine Runtime (DIP-02).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para o fluxo funcional de captura na Document Intelligence Platform.
 *
 * Fluxo obrigatório (sem implementação paralela):
 *   Produto → Enterprise Runtime → CaptureEngineRuntimePort
 *     → Canonical Execution Orchestrator → DocumentIntakeRuntime
 *     → DocumentIntakePort → Adapter → Implementação existente
 *
 * NÃO implementa OCR, IA, XML, TISS, parser, classificação, Workflow,
 * Rule Engine, Storage Manager, versionamento ou busca.
 */
import type {
  CaptureEngineRuntimeCapabilities,
  CaptureEngineRuntimeHealth,
  CaptureEngineRuntimeProviderId,
  GetCaptureRuntimeSessionInput,
  GetCaptureRuntimeSessionResult,
  ListCaptureRuntimeSessionsInput,
  ListCaptureRuntimeSessionsResult,
  RegisterCaptureInput,
  RegisterCaptureResult,
} from "./types";

export interface CaptureEngineRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: CaptureEngineRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<CaptureEngineRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): CaptureEngineRuntimeCapabilities;

  /**
   * Registra uma captura canônica via Orchestrator + DocumentIntakeRuntime.
   * Ponto único de entrada funcional de captura da Document Intelligence Platform.
   */
  registerCapture(input: RegisterCaptureInput): Promise<RegisterCaptureResult>;

  /** Obtém sessão de captura por id. */
  getSession(input: GetCaptureRuntimeSessionInput): Promise<GetCaptureRuntimeSessionResult>;

  /** Lista sessões de captura (filtros estruturais opcionais). */
  listSessions(input?: ListCaptureRuntimeSessionsInput): Promise<ListCaptureRuntimeSessionsResult>;
}
