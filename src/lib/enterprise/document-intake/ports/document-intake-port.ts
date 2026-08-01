/**
 * DocumentIntakePort — contrato único de Document Intake Foundation (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-12: fundação arquitetural genérica de entrada documental.
 * NÃO interpreta documentos. NÃO extrai texto. NÃO executa OCR.
 * NÃO valida contratos. NÃO conhece TISS. NÃO implementa captura,
 * upload, watcher, scanner ou e-mail.
 *
 * Document Intake apenas recebe documentos e os encaminha
 * estruturalmente para o pipeline Enterprise (via referências opacas).
 */
import type {
  CreateIntakeInput,
  CreateIntakeResult,
  DocumentIntakeCapabilities,
  DocumentIntakeHealth,
  DocumentIntakeProviderId,
  GetIntakeInput,
  GetIntakeResult,
  ListIntakesInput,
  ListIntakesResult,
} from "./types";

export interface DocumentIntakePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentIntakeProviderId;

  /** Verificação leve de prontidão (sem alterar intakes). */
  health(): Promise<DocumentIntakeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentIntakeCapabilities;

  /** Cria / registra um Intake canônico. */
  createIntake(input: CreateIntakeInput): Promise<CreateIntakeResult>;

  /** Obtém um intake por IntakeId. */
  getIntake(input: GetIntakeInput): Promise<GetIntakeResult>;

  /** Lista intakes (filtros estruturais opcionais). */
  listIntakes(input?: ListIntakesInput): Promise<ListIntakesResult>;
}
