/**
 * ValidationRuntimePort — contrato único do Enterprise Validation Runtime
 * (F3-CAP-08).
 *
 * Application / Enterprise Runtime dependem exclusivamente desta interface
 * para orquestração estrutural de jobs / requests / documentos de validação.
 *
 * Fluxo estrutural (F3-CAP-08):
 *   Produto → Enterprise Runtime → ValidationRuntimePort
 *     → Adapter → Validation Runtime Store → ValidationResult
 *
 * F3-CAP-08: infraestrutura canônica estrutural apenas. Sem validação real.
 * Sem auditoria. Sem IA. Sem ML. Sem LLM. Sem correção automática.
 * Sem regras TISS. Sem regras de operadoras. Sem persistência.
 */
import type {
  CloseValidationJobInput,
  CloseValidationJobResult,
  GetValidationResultInput,
  GetValidationResultResult,
  OpenValidationJobInput,
  OpenValidationJobResult,
  RegisterValidationDocumentInput,
  RegisterValidationDocumentResult,
  SubmitValidationRequestInput,
  SubmitValidationRequestResult,
  ValidationRuntimeCapabilities,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
  ValidationRuntimeProviderId,
  ValidationStatsInput,
  ValidationStatsResult,
} from "./types";

export interface ValidationRuntimePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: ValidationRuntimeProviderId;

  // -------------------------------------------------------------------------
  // F3-CAP-08 — operações estruturais canônicas (nunca executam validação real).
  // -------------------------------------------------------------------------

  /** Abre job estrutural de validação. NÃO inicia validação real. NÃO lê arquivos. */
  openJob(input: OpenValidationJobInput): Promise<OpenValidationJobResult>;

  /** Fecha job estrutural de validação. NÃO interrompe validação real (não há). */
  closeJob(input: CloseValidationJobInput): Promise<CloseValidationJobResult>;

  /** Cria request estrutural de validação dentro de um job. NÃO dispara engine. */
  submitRequest(input: SubmitValidationRequestInput): Promise<SubmitValidationRequestResult>;

  /** Registra referência estrutural de documento. NÃO valida bytes/campos reais. */
  registerDocument(
    input: RegisterValidationDocumentInput,
  ): Promise<RegisterValidationDocumentResult>;

  /** Obtém resultado estrutural por job/request/documento. NÃO valida campos. */
  getResult(input: GetValidationResultInput): Promise<GetValidationResultResult>;

  /** Estatísticas estruturais do store in-memory (F3-CAP-08). */
  stats(input?: ValidationStatsInput): Promise<ValidationStatsResult>;

  /** Verificação leve de prontidão (shape-check de Ports Enterprise quando disponíveis). */
  health(): Promise<ValidationRuntimeHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): ValidationRuntimeCapabilities;

  /** Metadados agregados do provedor (F3-CAP-08). */
  providerInfo(): ValidationRuntimeInfo;
}
