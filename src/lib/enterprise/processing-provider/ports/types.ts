/**
 * Tipos vendor-agnósticos do Processing Provider Framework — EPC-14.
 *
 * O Framework NÃO conhece implementação de OCR, PDF, XML, JSON, HL7,
 * DICOM, Barcode, QRCode ou IA. Conhece apenas:
 *   Provider | Capabilities | Input | Output | Health | Configuration
 *
 * ProviderType é enumeração estrutural — sem lógica.
 *
 * Arquitetura obrigatória:
 *   Application → ProcessingProviderPort → Adapter
 *     → Registry → Factory → Provider
 */

/* ─────────────────────────────────────────────────────────────────────────
 * ProviderType (FASE 7) — somente enumeração, sem implementação
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Tipo estrutural de Processing Provider.
 * Enumeração apenas — sem OCR, PDF, XML, parsers ou I/O.
 */
export type ProviderType =
  | "OCR"
  | "PDF"
  | "XML"
  | "JSON"
  | "BARCODE"
  | "QRCODE"
  | "HL7"
  | "DICOM"
  | "CUSTOM"
  | "UNKNOWN"
  | (string & {});

export const PROVIDER_TYPES: readonly ProviderType[] = [
  "OCR",
  "PDF",
  "XML",
  "JSON",
  "BARCODE",
  "QRCODE",
  "HL7",
  "DICOM",
  "CUSTOM",
  "UNKNOWN",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Identidade / status
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de um Processing Provider registrado. */
export type ProviderId = string;

/** Nome legível do Provider. */
export type ProviderName = string;

/** Versão declarada do Provider. */
export type ProviderVersion = string;

/** Status de saúde declarado no descriptor (sem I/O). */
export type HealthStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown" | (string & {});

export const HEALTH_STATUSES: readonly HealthStatus[] = [
  "ready",
  "stub",
  "disabled",
  "unhealthy",
  "unknown",
] as const;

/** Tag genérica — classificação livre. */
export type ProviderTag = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Configuration Engine. */
export type ProviderConfigurationReference = {
  id?: string;
  kind?: string;
  version?: string;
  namespace?: string;
};

/** Referência opaca a Metadata Engine. */
export type ProviderMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProviderCapabilities (FASE 6) — modelo canônico, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades declaradas por um Processing Provider.
 * Apenas declaração estrutural — sem seleção, sem execução.
 */
export type ProviderCapabilities = {
  supportedInputs?: readonly string[];
  supportedOutputs?: readonly string[];
  supportedLanguages?: readonly string[];
  supportsAsync?: boolean;
  supportsBatch?: boolean;
  supportsStreaming?: boolean;
  supportsConfidence?: boolean;
  supportsMetadata?: boolean;
  supportsAttachments?: boolean;
  /** Tamanho máximo declarado (bytes) — sem validação nesta sprint. */
  maxDocumentSize?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProviderDescriptor (FASE 5) — modelo canônico do Provider
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * ProviderDescriptor — registro canônico de QUALQUER Processing Provider.
 *
 * Nenhum campo específico de OCR/PDF/XML/Barcode/QRCode/HL7/DICOM/IA.
 * Futuros Providers são descritos apenas por este modelo.
 */
export type ProviderDescriptor = {
  providerId: ProviderId;
  providerName: ProviderName;
  providerVersion: ProviderVersion;
  providerType: ProviderType;
  capabilities: ProviderCapabilities;
  priority?: number;
  enabled?: boolean;
  healthStatus?: HealthStatus;
  configurationReference?: ProviderConfigurationReference;
  metadataReference?: ProviderMetadataReference;
  tags?: readonly ProviderTag[];
  /** Atributos livres opacos — sem schema clínico / TISS / OCR específico. */
  customAttributes?: Readonly<Record<string, unknown>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id) — distinto do ProviderId registrado
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Processing Provider Framework (extensível). */
export type ProcessingProviderProviderId = "default" | "mock" | "test" | "database" | "remote";

/** Resultado de health check do Framework Port. */
export type ProcessingProviderHealth = {
  ok: boolean;
  provider: ProcessingProviderProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de Providers registrados no momento do health. */
  registeredCount?: number;
};

/**
 * Capacidades do Framework Port (adapter-level).
 * Distintas de ProviderCapabilities (campo do descriptor).
 */
export type ProcessingProviderCapabilities = {
  provider: ProcessingProviderProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsRegisterProvider: boolean;
  supportsUnregisterProvider: boolean;
  supportsGetProvider: boolean;
  supportsListProviders: boolean;
  /** Registry genérico com múltiplos Providers. */
  supportsMultipleProviders: boolean;
  /** Seleção futura por capacidades (declarativa — sem lógica). */
  supportsCapabilitySelection: boolean;
  /** Declaração estrutural de processamento assíncrono futuro. */
  supportsAsyncDeclaration: boolean;
  /** Declaração estrutural de processamento em lote futuro. */
  supportsBatchDeclaration: boolean;
  /** Declaração estrutural de streaming futuro. */
  supportsStreamingDeclaration: boolean;
  /** Preparação para Document Processing Foundation (sem bind). */
  supportsFutureDocumentProcessingFoundation: boolean;
  /** Preparação para AI Providers (sem bind). */
  supportsFutureAiProviders: boolean;
  /** Preparação para Workflow (sem bind). */
  supportsFutureWorkflow: boolean;
  /** Preparação para Rule Engine (sem bind). */
  supportsFutureRuleEngine: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type RegisterProviderInput = {
  provider: Omit<
    ProviderDescriptor,
    "providerId" | "providerName" | "providerVersion" | "providerType" | "capabilities"
  > & {
    providerId?: ProviderId;
    providerName?: ProviderName;
    providerVersion?: ProviderVersion;
    providerType?: ProviderType;
    capabilities?: ProviderCapabilities;
  };
};

export type RegisterProviderResult = {
  ok: boolean;
  providerId: ProviderId;
  provider?: ProviderDescriptor;
  message?: string;
  code?: string;
};

export type UnregisterProviderInput = {
  providerId: ProviderId;
};

export type UnregisterProviderResult = {
  ok: boolean;
  providerId: ProviderId;
  message?: string;
  code?: string;
};

export type GetProviderInput = {
  providerId: ProviderId;
};

export type GetProviderResult = {
  ok: boolean;
  provider?: ProviderDescriptor;
  message?: string;
  code?: string;
};

export type ListProvidersInput = {
  providerType?: ProviderType;
  enabled?: boolean;
  healthStatus?: HealthStatus;
  tag?: ProviderTag;
  /** Prefixo de providerId opcional. */
  idPrefix?: string;
  /** Filtra Providers que declaram a capability flag (seleção futura). */
  requiresAsync?: boolean;
  requiresBatch?: boolean;
  requiresStreaming?: boolean;
};

export type ListProvidersResult = {
  ok: boolean;
  providers: readonly ProviderDescriptor[];
  message?: string;
  code?: string;
};

/** Opções de resolução do ProcessingProviderPort (provider factory). */
export type ProcessingProviderProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: ProcessingProviderProviderId;
};
