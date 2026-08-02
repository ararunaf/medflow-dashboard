/**
 * DocumentClassificationProviderPort — contrato único de classificação documental (CLASS-01).
 *
 * Application / Classification Runtime dependem exclusivamente desta interface.
 * Detalhes de regras / futuros vendors ficam exclusivamente em adapters.
 *
 * CLASS-01: Classification Provider oficial (rule-based).
 * NÃO usa IA / LLM / ML / embeddings / RAG.
 * Recebe apenas texto/estrutura produzidos pelo OCR Runtime.
 *
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → Capture Runtime → OCR Runtime
 *     → Document Classification Runtime → DocumentClassificationProviderPort
 *     → DefaultDocumentClassificationAdapter → Classification Provider
 */
import type {
  DocumentClassificationConfigurationValidation,
  DocumentClassificationProcessInput,
  DocumentClassificationProcessResult,
  DocumentClassificationProviderHealth,
  DocumentClassificationProviderId,
  DocumentClassificationProviderInfo,
  DocumentClassificationProviderPortCapabilities,
} from "./types";

export interface DocumentClassificationProviderPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentClassificationProviderId;

  /**
   * Classificação documental rule-based a partir do resultado OCR.
   * Retorna resultado alinhado ao modelo canônico (sem modelos paralelos).
   */
  classify(input: DocumentClassificationProcessInput): Promise<DocumentClassificationProcessResult>;

  /** Verificação leve de prontidão. */
  health(): Promise<DocumentClassificationProviderHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentClassificationProviderPortCapabilities;

  /** Metadados estáveis do provedor. */
  providerInfo(): DocumentClassificationProviderInfo;

  /**
   * Valida configuração estrutural do adapter.
   * NÃO realiza chamadas de rede nem usa credenciais reais.
   */
  validateConfiguration(): Promise<DocumentClassificationConfigurationValidation>;
}
