import { Download, FileJson, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OcrResultSummary, RawOcrResult } from "@/lib/capture/ocr";
import type { CapturePhase } from "../types";

export function CaptureOcrPanel({
  phase,
  summary,
  ocr,
  onDownloadJson,
  busy,
}: {
  phase: CapturePhase;
  summary: OcrResultSummary | null;
  ocr: RawOcrResult | null;
  onDownloadJson?: () => void;
  busy?: boolean;
}) {
  const showPanel =
    phase === "waiting_ocr" ||
    phase === "ocr_completed" ||
    phase === "completed" ||
    summary != null ||
    ocr != null;

  if (!showPanel) return null;

  const status = summary?.status ?? (phase === "waiting_ocr" ? "pending" : "pending");
  const provider = summary?.provider ?? ocr?.provider;
  const processingTimeMs = summary?.processingTimeMs ?? ocr?.processingTimeMs;
  const averageConfidence = summary?.averageConfidence ?? ocr?.averageConfidence;
  const pageCount = summary?.pageCount ?? ocr?.pageCount;
  const wordCount = summary?.wordCount ?? ocr?.wordCount;
  const previewText = ocr?.fullText ?? "";

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScanText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Resultado OCR</h2>
        </div>
        {onDownloadJson && status === "completed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy}
            onClick={onDownloadJson}
          >
            <FileJson className="h-3.5 w-3.5" />
            Baixar JSON OCR
          </Button>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Metric label="Status OCR" value={statusLabel(status, phase)} />
        <Metric label="Provider" value={provider ?? "—"} />
        <Metric label="Tempo" value={processingTimeMs != null ? `${processingTimeMs} ms` : "—"} />
        <Metric
          label="Confidence"
          value={averageConfidence != null ? `${(averageConfidence * 100).toFixed(1)}%` : "—"}
        />
        <Metric label="Páginas" value={pageCount != null ? String(pageCount) : "—"} />
        <Metric label="Palavras" value={wordCount != null ? String(wordCount) : "—"} />
      </dl>

      {summary?.error ? <p className="text-sm text-destructive">{summary.error}</p> : null}

      {previewText ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Texto OCR</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap break-words">
            {previewText}
          </pre>
        </div>
      ) : phase === "waiting_ocr" ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Download className="h-3 w-3 animate-pulse" />
          Processando OCR…
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium font-mono text-sm truncate">{value}</dd>
    </div>
  );
}

function statusLabel(status: OcrResultSummary["status"], phase: CapturePhase): string {
  if (status === "completed" || phase === "ocr_completed") return "Concluído";
  if (status === "failed") return "Falhou";
  return "Pendente";
}
