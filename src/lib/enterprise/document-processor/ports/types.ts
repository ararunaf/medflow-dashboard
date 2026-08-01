/**
 * Tipos vendor-agnósticos da camada Document Processing Foundation — EPC-13.
 *
 * Nenhum tipo clínico, TISS, OCR implementado, IA, parser XML/PDF,
 * Barcode, QRCode, upload, scanner, contrato específico, operadora
 * ou cooperativa deve aparecer aqui.
 *
 * Document Processing Foundation fornece apenas a infraestrutura canônica
 * de processamento documental. Todo Processor (futuro) produz o mesmo
 * modelo de saída — o restante do Enterprise nunca conhece a tecnologia.
 *
 * Arquitetura obrigatória:
 *   Application → DocumentProcessorPort → Adapter → Store → Factory → Provider
 */

/** Provedores / mecanismos de document processor (extensível). */
export type DocumentProcessorProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "registry";

/** Resultado de health check. */
export type DocumentProcessorHealth = {
  ok: boolean;
  provider: DocumentProcessorProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 * Usado por Application/Domain sem conhecer o store.
 */
export type DocumentProcessorCapabilities = {
  provider: DocumentProcessorProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsProcess: boolean;
  supportsGetProcessing: boolean;
  supportsListProcessings: boolean;
  /** Múltiplos ProcessorTypes (enum estrutural). */
  supportsMultipleProcessorTypes: boolean;
  /** Modelo canônico único de saída (ProcessingOutput). */
  supportsCanonicalOutput: boolean;
  /** Referências opacas a Document Identity. */
  supportsDocumentIdentityReference: boolean;
  /** Referências opacas a Metadata Engine. */
  supportsMetadataReference: boolean;
  /** Referências opacas a Storage (sem I/O). */
  supportsStorageReference: boolean;
  /** Referências opacas a Output (ProcessingOutput). */
  supportsOutputReference: boolean;
  /** Preparação estrutural para OCR / AI / Workflow / Contract / Intake (sem bind). */
  supportsFutureIntegrationHooks: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProcessorType (FASE 7) — somente enumeração, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Tipo estrutural de processador documental.
 * Enumeração apenas — sem OCR, XML, PDF, Barcode, QRCode ou I/O.
 */
export type ProcessorType =
  | "OCR"
  | "PDF_TEXT"
  | "XML"
  | "JSON"
  | "BARCODE"
  | "QRCODE"
  | "HL7"
  | "DICOM"
  | "CUSTOM"
  | "UNKNOWN"
  | (string & {});

export const PROCESSOR_TYPES: readonly ProcessorType[] = [
  "OCR",
  "PDF_TEXT",
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
 * Status de processamento — estrutural, sem orquestração
 * ───────────────────────────────────────────────────────────────────────── */

export type ProcessingStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN"
  | (string & {});

export const PROCESSING_STATUSES: readonly ProcessingStatus[] = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
] as const;

/** Identificador estável de um Processing. */
export type ProcessingId = string;

/** Identificador estável de um ProcessingOutput. */
export type OutputId = string;

/** Tag genérica — classificação livre. */
export type ProcessingTag = string;

/**
 * Capacidade declarada pelo próprio resultado (campo do modelo).
 * Distinta de DocumentProcessorCapabilities (adapter/Port).
 */
export type ProcessingDeclaredCapability = string;

/** Warning estrutural genérico. */
export type ProcessingWarning = {
  code?: string;
  message?: string;
  severity?: string;
  path?: string;
};

/** Error estrutural genérico. */
export type ProcessingError = {
  code?: string;
  message?: string;
  severity?: string;
  path?: string;
};

/** Confiança numérica genérica (0–1 ou escala livre — sem semântica de OCR). */
export type ProcessingConfidence = number;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Document Identity (sem import do módulo). */
export type ProcessingDocumentIdentityReference = {
  documentId?: string;
  documentType?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Metadata Engine. */
export type ProcessingMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Storage Port (sem I/O). */
export type ProcessingStorageReference = {
  key?: string;
  container?: string;
  provider?: string;
  uri?: string;
};

/** Referência opaca a ProcessingOutput. */
export type ProcessingOutputReference = {
  outputId?: string;
  contentType?: string;
  kind?: string;
  version?: string;
};

/** Referência opaca genérica a artefato Enterprise / externo. */
export type ProcessingOpaqueReference = {
  id?: string;
  kind?: string;
  name?: string;
  version?: string;
  uri?: string;
  target?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ProcessingOutput (FASE 8) — modelo canônico único de saída
 * ───────────────────────────────────────────────────────────────────────── */

/** Página estrutural genérica no output (sem semântica de OCR). */
export type ProcessingOutputPage = {
  pageId?: string;
  sequence?: number;
  width?: number;
  height?: number;
  confidence?: ProcessingConfidence;
  tags?: readonly ProcessingTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/** Anexo estrutural no output — apenas metadados / refs opacas. */
export type ProcessingOutputAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  storageReference?: ProcessingStorageReference;
  uri?: string;
  tags?: readonly ProcessingTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/**
 * ProcessingOutput — saída canônica de QUALQUER processador.
 *
 * Nenhum campo específico de OCR, XML, PDF, Barcode, QRCode, HL7 ou DICOM.
 * Todo Document Processor futuro produz exatamente este modelo.
 */
export type ProcessingOutput = {
  outputId: OutputId;
  contentType?: string;
  /** Dados estruturados opacos — sem schema clínico / TISS. */
  structuredData?: Readonly<Record<string, unknown>>;
  /** Ref opaca a dados brutos em Storage / URI. */
  rawDataReference?: ProcessingStorageReference;
  metadataReference?: ProcessingMetadataReference;
  confidence?: ProcessingConfidence;
  language?: string;
  encoding?: string;
  pages?: readonly ProcessingOutputPage[];
  attachments?: readonly ProcessingOutputAttachment[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * DocumentProcessingResult (FASE 6) — modelo canônico do resultado
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * DocumentProcessingResult — estrutura canônica genérica de processamento.
 *
 * Campos canônicos:
 * ProcessingId | ProcessorType | Status | StartedAt | FinishedAt | Duration |
 * Confidence | Warnings | Errors | MetadataReference |
 * DocumentIdentityReference | OutputReference | Capabilities | Tags | CustomAttributes
 *
 * O restante do Enterprise consome apenas este modelo + ProcessingOutput,
 * independentemente da tecnologia de processamento.
 */
export type DocumentProcessingResult = {
  processingId: ProcessingId;
  processorType: ProcessorType;
  status: ProcessingStatus;
  startedAt?: string;
  finishedAt?: string;
  /** Duração em milissegundos (quando conhecida). */
  duration?: number;
  confidence?: ProcessingConfidence;
  warnings?: readonly ProcessingWarning[];
  errors?: readonly ProcessingError[];
  metadataReference?: ProcessingMetadataReference;
  documentIdentityReference?: ProcessingDocumentIdentityReference;
  outputReference?: ProcessingOutputReference;
  capabilities?: readonly ProcessingDeclaredCapability[];
  tags?: readonly ProcessingTag[];
  /** Atributos livres opacos — sem schema clínico / TISS / OCR específico. */
  customAttributes?: Readonly<Record<string, unknown>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Input de process() — registra um processamento canônico in-memory.
 * NÃO executa OCR, IA, XML, PDF, Barcode ou QRCode.
 */
export type ProcessInput = {
  processing: Omit<DocumentProcessingResult, "processingId" | "processorType" | "status"> & {
    processingId?: ProcessingId;
    processorType?: ProcessorType;
    status?: ProcessingStatus;
  };
  /** Saída canônica opcional produzida pelo processamento. */
  output?: Omit<ProcessingOutput, "outputId"> & {
    outputId?: OutputId;
  };
};

export type ProcessResult = {
  ok: boolean;
  processingId: ProcessingId;
  processing?: DocumentProcessingResult;
  output?: ProcessingOutput;
  message?: string;
  code?: string;
};

export type GetProcessingInput = {
  processingId: ProcessingId;
};

export type GetProcessingResult = {
  ok: boolean;
  processing?: DocumentProcessingResult;
  output?: ProcessingOutput;
  message?: string;
  code?: string;
};

export type ListProcessingsInput = {
  processorType?: ProcessorType;
  status?: ProcessingStatus;
  tag?: ProcessingTag;
  /** Prefixo de processingId opcional. */
  idPrefix?: string;
  /** DocumentId opaco — filtra por Document Identity. */
  documentId?: string;
};

export type ListProcessingsResult = {
  ok: boolean;
  processings: readonly DocumentProcessingResult[];
  message?: string;
  code?: string;
};

/** Opções de resolução do DocumentProcessorPort (provider factory). */
export type DocumentProcessorProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: DocumentProcessorProviderId;
};
