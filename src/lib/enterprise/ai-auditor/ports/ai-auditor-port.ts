/**
 * AIAuditorPort — contrato único da AI Auditora Enterprise (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, factory ou AI Orchestrator ficam nos adapters.
 *
 * EPC-18: fundação da AI Auditora. NÃO implementa IA real, HTTP, prompts,
 * OCR, TISS, Workflow operacional, banco, UI ou APIs.
 *
 * A AI Auditora NÃO toma decisões / NÃO aprova / NÃO reprova /
 * NÃO executa regras / NÃO interpreta contratos.
 *
 * Produz exclusivamente AuditExplanation.
 * Utiliza apenas AI Orchestrator (EPC-16) → AI Provider Framework (EPC-07).
 */
import type {
  AIAuditorCapabilities,
  AIAuditorConfigurationValidation,
  AIAuditorHealth,
  AIAuditorProviderId,
  AIAuditorProviderInfo,
  AuditRequest,
  AuditResult,
} from "./types";

export interface AIAuditorPort {
  /** Identificador estável do mecanismo por trás do adapter. */
  readonly providerId: AIAuditorProviderId;

  /**
   * Gera AuditExplanation a partir de um resultado determinístico.
   * NÃO decide. NÃO aprova. NÃO reprova. NÃO executa regras.
   * NÃO realiza HTTP. NÃO usa prompts nesta fundação.
   */
  audit(request: AuditRequest): Promise<AuditResult>;

  /** Verificação leve de prontidão (sem I/O externo obrigatório). */
  health(): Promise<AIAuditorHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): AIAuditorCapabilities;

  /** Metadados estáveis do mecanismo da AI Auditora. */
  providerInfo(): AIAuditorProviderInfo;

  /**
   * Valida configuração estrutural do adapter + Orchestrator.
   * NÃO realiza chamadas de rede nem usa chaves de API.
   */
  validateConfiguration(): Promise<AIAuditorConfigurationValidation>;
}
