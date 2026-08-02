/**
 * DocumentIntakeRuntimePort — contrato único do Document Intake Runtime (DIP-01).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para o fluxo funcional de intake na Document Intelligence Platform.
 *
 * Fluxo obrigatório (sem implementação paralela):
 *   Produto → Enterprise Runtime → DocumentIntakeRuntimePort
 *     → Canonical Execution Orchestrator → DocumentIntakePort → Adapter
 *
 * NÃO implementa OCR, IA, XML, TISS, parser, classificação, Workflow ou Rule Engine.
 */
import type {
  DocumentIntakeRuntimeCapabilities,
  DocumentIntakeRuntimeHealth,
  DocumentIntakeRuntimeProviderId,
  GetIntakeRuntimeSessionInput,
  GetIntakeRuntimeSessionResult,
  ListIntakeRuntimeSessionsInput,
  ListIntakeRuntimeSessionsResult,
  RegisterIntakeInput,
  RegisterIntakeResult,
} from "./types";

export interface DocumentIntakeRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentIntakeRuntimeProviderId;

  /** Verificação leve de prontidão (consulta Ports Enterprise quando disponíveis). */
  health(): Promise<DocumentIntakeRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentIntakeRuntimeCapabilities;

  /**
   * Registra um documento como intake canônico via Orchestrator + DocumentIntakePort.
   * Ponto único de entrada funcional da Document Intelligence Platform.
   */
  registerIntake(input: RegisterIntakeInput): Promise<RegisterIntakeResult>;

  /** Obtém sessão de runtime por id. */
  getSession(input: GetIntakeRuntimeSessionInput): Promise<GetIntakeRuntimeSessionResult>;

  /** Lista sessões (filtros estruturais opcionais). */
  listSessions(input?: ListIntakeRuntimeSessionsInput): Promise<ListIntakeRuntimeSessionsResult>;
}
