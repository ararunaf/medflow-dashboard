/**
 * OCRCapabilities — capacidades declarativas do OCR Provider (EPC-15 FASE 6).
 *
 * Apenas declaração estrutural. Sem implementação de OCR, sem I/O, sem IA.
 * Nenhum conhecimento de cooperativas, operadoras, contratos, TISS ou Workflow.
 */

/**
 * Capacidades tecnológicas genéricas de um mecanismo OCR.
 * Semântica de extração documental apenas — nunca interpretação de domínio.
 */
export type OCRCapabilities = {
  /** Formatos de entrada suportados (ex.: "application/pdf", "image/png"). */
  supportedFormats?: readonly string[];
  /** Idiomas declarados (ex.: "pt-BR", "en"). */
  supportedLanguages?: readonly string[];
  supportsMultiPage?: boolean;
  supportsTables?: boolean;
  supportsHandwriting?: boolean;
  supportsConfidence?: boolean;
  supportsRotation?: boolean;
  supportsBatch?: boolean;
  supportsAsync?: boolean;
  /** Limite declarado de páginas — sem validação nesta sprint. */
  maxPages?: number;
  /** Limite declarado de tamanho (bytes) — sem validação nesta sprint. */
  maxFileSize?: number;
};

/** Capabilities vazias canônicas. */
export function emptyOCRCapabilities(): OCRCapabilities {
  return {};
}

/**
 * Define / normaliza um bloco de OCRCapabilities (estrutural).
 * Sem validação de domínio e sem execução.
 */
export function defineOCRCapabilities(capabilities: OCRCapabilities = {}): OCRCapabilities {
  return { ...capabilities };
}

/** Capabilities canônicas do DefaultMockOCRProvider. */
export const DEFAULT_MOCK_OCR_CAPABILITIES: OCRCapabilities = {
  supportedFormats: ["application/pdf", "image/png", "image/jpeg", "image/tiff"],
  supportedLanguages: ["pt-BR", "en"],
  supportsMultiPage: true,
  supportsTables: true,
  supportsHandwriting: false,
  supportsConfidence: true,
  supportsRotation: true,
  supportsBatch: false,
  supportsAsync: false,
  maxPages: 100,
  maxFileSize: 25 * 1024 * 1024,
};
