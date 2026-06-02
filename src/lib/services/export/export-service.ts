/**
 * Exportações leves no cliente (CSV, Excel via HTML, impressão/PDF pelo diálogo do SO).
 * Evita workers e libs pesadas — adequado à V1 operacional.
 */
import { BRANDING } from "@/lib/assets/branding";
import type { ReportTableSection } from "@/lib/services/reporting/reporting-service";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** CSV UTF-8 com BOM para abrir corretamente no Excel em PT-BR. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
): void {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  const body = `\uFEFF${lines.join("\r\n")}`;
  triggerDownload(
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    new Blob([body], { type: "text/csv;charset=utf-8" }),
  );
}

/**
 * Excel legível pelo Office/LibreOffice: HTML de tabela com MIME histórico.
 * Limite a volumes moderados (relatórios operacionais).
 */
export function downloadExcelHtmlTable(
  filename: string,
  sheetName: string,
  tableHtml: string,
): void {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${escapeHtml(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${tableHtml}</body></html>`;
  const fn = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  triggerDownload(fn, new Blob([html], { type: "application/vnd.ms-excel" }));
}

export function reportSectionsToHtmlTable(sections: ReportTableSection[]): string {
  return sections
    .map((s) => {
      const th = s.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
      const trs = s.rows
        .map((row) => {
          const tds = s.columns.map((c) => `<td>${escapeHtml(String(row[c] ?? ""))}</td>`).join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<h2 style="font-family:system-ui,sans-serif;font-size:14px;margin:16px 0 8px">${escapeHtml(s.title)}</h2>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:12px;width:100%">
<thead><tr style="background:#f3f4f6">${th}</tr></thead><tbody>${trs}</tbody></table>`;
    })
    .join("");
}

export function openPrintableOperationalReport(
  title: string,
  sections: ReportTableSection[],
): void {
  const inner = reportSectionsToHtmlTable(sections);
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: system-ui, sans-serif; color: #111; }
  table { border-collapse: collapse; width: 100%; page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 11px; }
  th { background: #f3f4f6; text-align: left; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  .meta { font-size: 11px; color: #555; margin-bottom: 20px; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="meta">Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))} · ${escapeHtml(BRANDING.productName)}</p>
${inner}
<p class="no-print" style="margin-top:24px"><button type="button" onclick="window.print()" style="padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer">Imprimir / salvar PDF</button></p>
</body></html>`;
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(doc);
  w.document.close();
}

/** Export genérico de auditoria (linhas planas). */
export function downloadAuditRowsCsv(
  filename: string,
  rows: Array<Record<string, string | number | boolean | null>>,
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  downloadCsv(filename, headers, rows);
}
