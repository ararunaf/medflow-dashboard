/**
 * OCRProviderPort — contrato único de integração com provedores OCR (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de Azure Document Intelligence / Google Document AI / Tesseract
 * ficam em adapters futuros — NÃO implementados nesta sprint.
 *
 * EPC-15: fundação arquitetural do primeiro Processing Provider.
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
   * Mock/stub nesta sprint — sem OCR real e sem rede.
   */
  process(input: OCRProcessInput): Promise<OCRProcessResult>;

  /** Verificação leve de prontidão (sem I/O externo na fundação). */
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
