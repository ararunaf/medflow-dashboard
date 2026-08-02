/**
 * OCRProviderPort — contrato único de integração com provedores OCR (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de Azure Document Intelligence / Google Document AI / Tesseract
 * ficam exclusivamente em adapters (OCR-01: AzureDocumentIntelligenceAdapter).
 *
 * EPC-15 / OCR-01: Processing Provider oficial.
 * O OCR apenas extrai conteúdo. Produz exclusivamente ProcessingOutput.
 * NÃO interpreta, valida, toma decisões ou conhece domínio clínico / TISS.
 */
import type {
  OCRConfigurationValidation,
  OCRProcessInput,
  OCRProcessResult,
  OCRProviderHealth,
  OCRProviderId,
  OCRProviderInfo,
  OCRProviderPortCapabilities,
} from "./types";

export interface OCRProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: OCRProviderId;

  /**
   * Extração documental genérica.
   * Retorna exclusivamente ProcessingOutput + DocumentProcessingResult canônicos.
   * Azure Adapter (OCR-01) é o único caminho HTTP autorizado.
   */
  process(input: OCRProcessInput): Promise<OCRProcessResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<OCRProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): OCRProviderPortCapabilities;

  /** Metadados estáveis do provedor (nome, versão, status, tipo OCR). */
  providerInfo(): OCRProviderInfo;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza chamadas de rede nem usa credenciais reais.
   */
  validateConfiguration(): Promise<OCRConfigurationValidation>;
}
