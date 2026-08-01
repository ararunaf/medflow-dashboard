import { Download, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsSnapshot } from "@/lib/capture/analytics";
import {
  buildAnalyticsExportSections,
  buildAnalyticsSummaryCsvRows,
} from "@/lib/capture/analytics";
import {
  downloadCsv,
  downloadExcelHtmlTable,
  openPrintableOperationalReport,
  reportSectionsToHtmlTable,
} from "@/lib/services/export/export-service";

type AnalyticsExportBarProps = {
  snapshot: AnalyticsSnapshot | null;
  disabled?: boolean;
};

export function AnalyticsExportBar({ snapshot, disabled }: AnalyticsExportBarProps) {
  if (!snapshot) return null;

  const stamp = new Date(snapshot.asOf).toISOString().slice(0, 10);

  function exportPdf() {
    const sections = buildAnalyticsExportSections(snapshot!);
    openPrintableOperationalReport(`MedicFlow Analytics — ${stamp}`, sections);
  }

  function exportExcel() {
    const sections = buildAnalyticsExportSections(snapshot!);
    downloadExcelHtmlTable(
      `medicflow-analytics-${stamp}.xls`,
      "Analytics",
      reportSectionsToHtmlTable(sections),
    );
  }

  function exportCsvSummary() {
    const rows = buildAnalyticsSummaryCsvRows(snapshot!);
    downloadCsv(
      `medicflow-analytics-resumo-${stamp}.csv`,
      ["metric", "value", "generated_at"],
      rows,
    );
  }

  function exportCsvFull() {
    const sections = buildAnalyticsExportSections(snapshot!);
    const flat: Array<Record<string, string>> = [];
    for (const section of sections) {
      for (const row of section.rows) {
        flat.push({
          section: section.title,
          ...Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "")])),
        });
      }
    }
    if (flat.length === 0) return;
    const headers = Object.keys(flat[0]!);
    downloadCsv(`medicflow-analytics-completo-${stamp}.csv`, headers, flat);
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="analytics-export-bar">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={exportPdf}
      >
        <FileDown className="h-3.5 w-3.5" />
        PDF executivo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={exportExcel}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={exportCsvSummary}
      >
        <Download className="h-3.5 w-3.5" />
        CSV resumo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={exportCsvFull}
      >
        <Download className="h-3.5 w-3.5" />
        CSV completo
      </Button>
    </div>
  );
}
