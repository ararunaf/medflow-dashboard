/**
 * Contratos canônicos do Validation Report funcional — D-10 / BLOCO D.
 *
 * Consolida resultados de validações existentes sem TISS/ANS/Operadoras.
 */
/** Entrada de um resultado consolidado. */
export type XMLValidationReportResultItem = {
  ok: boolean;
  operation: string;
  code?: string | null;
  message?: string | null;
};

/** Fonte de dados para o relatório. */
export type XMLValidationReportInput = {
  /** Identificador da requisição/report. */
  reportId?: string;
  /** Resultados de validações/reparos/correções a consolidar. */
  results: readonly XMLValidationReportResultItem[];
};

/** Item consolidado de um resultado. */
export type XMLValidationReportItem = {
  kind: "xml-validation-report-item";
  ok: boolean;
  operation: string;
  code?: string | null;
  message?: string | null;
};

/** Resumo estatístico do relatório. */
export type XMLValidationReportSummary = {
  kind: "xml-validation-report-summary";
  total: number;
  passed: number;
  failed: number;
  byOperation: Record<string, { passed: number; failed: number }>;
};

/**
 * Resultado canônico do Validation Report (D-10).
 */
export type CanonicalXMLValidationReport = {
  kind: "canonical-xml-validation-report";
  ok: boolean;
  reportId: string;
  items: readonly XMLValidationReportItem[];
  summary: XMLValidationReportSummary;
  context?: CanonicalXMLValidationReportContext | null;
  code?: string;
  message?: string;
};

/**
 * Contexto expandido do Validation Report (D-10).
 */
export type CanonicalXMLValidationReportContext = {
  kind: "canonical-xml-validation-report-context";
  reportId: string;
  items: readonly XMLValidationReportItem[];
  summary: XMLValidationReportSummary;
  /** D-10 — única capability funcional habilitada neste contexto. */
  validationReportImplemented: true;
};

/** Helper — contexto vazio. */
export function createEmptyXMLValidationReportContext(
  overrides: Partial<CanonicalXMLValidationReportContext> = {},
): CanonicalXMLValidationReportContext {
  const emptySummary: XMLValidationReportSummary = {
    kind: "xml-validation-report-summary",
    total: 0,
    passed: 0,
    failed: 0,
    byOperation: {},
  };
  return {
    kind: "canonical-xml-validation-report-context",
    reportId: overrides.reportId ?? "",
    items: overrides.items ?? [],
    summary: overrides.summary ?? emptySummary,
    validationReportImplemented: true,
  };
}
