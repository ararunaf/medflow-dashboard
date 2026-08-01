/**
 * Tipos vendor-agnósticos da camada OCR Provider — EPC-15.
 *
 * O OCR apenas extrai conteúdo. Nunca interpreta, valida ou toma decisões.
 * Nunca conhece cooperativas, operadoras, contratos, TISS, AI, Workflow
 * ou Rule Engine.
 *
 * Todo resultado de process() utiliza exclusivamente os modelos canônicos
 * da Document Processing Foundation (EPC-13):
 *   ProcessingOutput | DocumentProcessingResult |
 *   DocumentIdentityReference | MetadataReference
 *
 * Arquitetura obrigatória:
 *   Application → OCRProviderPort → OCRProviderAdapter
 *     → OCRProviderFactory → OCRProviderRegistry
 *     → Processing Provider Framework (EPC-14)
 *     → Document Processing Foundation (EPC-13)
 */
import type {
  DocumentProcessingResult,
  ProcessingDocumentIdentityReference,
  ProcessingMetadataReference,
  ProcessingOutput,
  ProcessingStorageReference,
} from "../../document-processor/ports/types";
import type { OCRCapabilities } from "./capabilities";

export type { OCRCapabilities };
export type {
  DocumentProcessingResult,
  ProcessingDocumentIdentityReference,
  ProcessingMetadataReference,
  ProcessingOutput,
  ProcessingStorageReference,
};

/** Provedores / mecanismos OCR suportados na fundação (extensível). */
export type OCRProviderId = "mock" | "test" | "default";

/** Status operacional declarado no registry. */
export type OCRProviderStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Resultado de health check do OCR Provider. */
export type OCRProviderHealth = {
  ok: boolean;
  provider: OCRProviderId;
  latencyMs?: number;
  message?: string;
  status?: OCRProviderStatus;
};

/**
 * Capacidades do adapter no nível do Port (além de OCRCapabilities).
 * Usado por Application/Domain sem conhecer o vendor.
 */
export type OCRProviderPortCapabilities = {
  provider: OCRProviderId;
  /** Identificador legível do adapter (ex.: mock-deterministic). */
  adapterId: string;
  /** Capacidades tecnológicas OCR (FASE 6). */
  ocr: OCRCapabilities;
  /** Produz exclusivamente ProcessingOutput canônico (EPC-13). */
  supportsCanonicalProcessingOutput: boolean;
  /** Emite DocumentProcessingResult com processorType OCR. */
  supportsDocumentProcessingResult: boolean;
  /** Aceita DocumentIdentityReference opaca. */
  supportsDocumentIdentityReference: boolean;
  /** Aceita MetadataReference opaca. */
  supportsMetadataReference: boolean;
  /**
   * Hook estrutural para futura normalização (FASE 8).
   * Sem implementação nesta sprint.
   */
  supportsFutureNormalizationHook: boolean;
  /** Preparação para motores OCR reais (sem bind / sem HTTP). */
  supportsFutureRealEngines: boolean;
};

/** Metadados estáveis do provedor OCR. */
export type OCRProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type OCRProviderInfo = {
  providerId: OCRProviderId;
  metadata: OCRProviderMetadata;
  status: OCRProviderStatus;
  /** Tipo canônico no Processing Provider Framework. */
  providerType: "OCR";
  capabilities: OCRCapabilities;
};

/** Resultado de validateConfiguration(). */
export type OCRConfigurationValidation = {
  ok: boolean;
  provider: OCRProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
};

/**
 * Input de process() — referências opacas apenas.
 * Sem upload, scanner, bytes de arquivo ou I/O.
 */
export type OCRProcessInput = {
  /** Identificador opcional da operação (trace). */
  requestId?: string;
  /** Content-type declarado (opaco). */
  contentType?: string;
  /** Idioma preferido (opaco). */
  language?: string;
  /** Ref opaca a Document Identity (EPC-08 / EPC-13). */
  documentIdentityReference?: ProcessingDocumentIdentityReference;
  /** Ref opaca a Metadata Engine (EPC-04 / EPC-13). */
  metadataReference?: ProcessingMetadataReference;
  /** Ref opaca a Storage (sem I/O). */
  rawDataReference?: ProcessingStorageReference;
  /** Bag livre — adapters não interpretam domínio. */
  attributes?: Readonly<Record<string, unknown>>;
};

/**
 * Resultado de process() — exclusivamente modelos canônicos EPC-13.
 * Nunca retorna objetos específicos de OCR (ocrText, boundingBoxes, etc.).
 */
export type OCRProcessResult = {
  ok: boolean;
  requestId?: string;
  provider: OCRProviderId;
  /** Resultado canônico com processorType = "OCR". */
  processing: DocumentProcessingResult;
  /** Saída canônica única — ProcessingOutput. */
  output: ProcessingOutput;
  message?: string;
  /** Indica resposta determinística de mock (nunca OCR real / rede). */
  simulated?: boolean;
};

/** Opções de resolução do OCRProviderPort (provider factory). */
export type OCRProviderOptions = {
  /**
   * Provedor desejado. Default da fundação: `mock`.
   * Nenhum motor real nesta sprint.
   */
  provider?: OCRProviderId;
};

/** Entrada de registro no OCRProviderRegistry. */
export type OCRProviderRegistration = {
  providerId: OCRProviderId;
  name: string;
  version: string;
  status: OCRProviderStatus;
  adapterId: string;
  vendor: string;
  capabilities: OCRCapabilities;
  description?: string;
};
