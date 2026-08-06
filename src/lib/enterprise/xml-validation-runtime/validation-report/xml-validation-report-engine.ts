/**
 * XMLValidationReportEngine — D-10 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Capability única: consolidação de relatórios genéricos de validação XML.
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem regras de negócio específicas.
 */
import type {
  CanonicalXMLValidationReport,
  CanonicalXMLValidationReportContext,
  XMLValidationReportInput,
  XMLValidationReportItem,
  XMLValidationReportResultItem,
  XMLValidationReportSummary,
} from "./canonical";
import { createEmptyXMLValidationReportContext } from "./canonical";

function createReportId(): string {
  return `xml-validation-report-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSummary(items: readonly XMLValidationReportItem[]): XMLValidationReportSummary {
  const byOperation: Record<string, { passed: number; failed: number }> = {};
  for (const item of items) {
    if (!byOperation[item.operation]) {
      byOperation[item.operation] = { passed: 0, failed: 0 };
    }
    if (item.ok) {
      byOperation[item.operation].passed++;
    } else {
      byOperation[item.operation].failed++;
    }
  }
  const passed = items.filter((i) => i.ok).length;
  const failed = items.length - passed;
  return {
    kind: "xml-validation-report-summary",
    total: items.length,
    passed,
    failed,
    byOperation,
  };
}

/**
 * Gera um relatório canônico consolidando resultados de validação existentes.
 */
export function generateXMLValidationReport(
  input: XMLValidationReportInput,
): CanonicalXMLValidationReport {
  const reportId = input.reportId ?? createReportId();
  const results: readonly XMLValidationReportResultItem[] = input.results ?? [];

  const items: XMLValidationReportItem[] = results.map((result) => ({
    kind: "xml-validation-report-item",
    ok: result.ok ?? false,
    operation: result.operation ?? "unknown",
    code: result.code ?? null,
    message: result.message ?? null,
  }));

  const summary = buildSummary(items);
  const ok = items.every((i) => i.ok);
  const context: CanonicalXMLValidationReportContext = createEmptyXMLValidationReportContext({
    reportId,
    items,
    summary,
  });

  return {
    kind: "canonical-xml-validation-report",
    ok,
    reportId,
    items,
    summary,
    context,
    code: ok ? "XML_VALIDATION_REPORT_OK" : "XML_VALIDATION_REPORT_HAS_FAILURES",
    message: ok
      ? `Validation report ${reportId} completed with all ${items.length} operation(s) passing.`
      : `Validation report ${reportId} completed with ${summary.failed} failure(s) out of ${items.length} operation(s).`,
  };
}

/**
 * Motor de relatório stateless para o XML Validation Runtime.
 */
export class XMLValidationReportEngine {
  generate(input: XMLValidationReportInput): CanonicalXMLValidationReport {
    return generateXMLValidationReport(input);
  }
}
