import { Gauge, ScanLine, Target } from "lucide-react";
import type { QualityIndicators } from "@/lib/capture/analytics";
import { formatProcessingDuration } from "@/lib/capture/processing/dashboard";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

type AnalyticsQualityPanelProps = {
  quality: QualityIndicators | null;
  busy: boolean;
};

export function AnalyticsQualityPanel({ quality, busy }: AnalyticsQualityPanelProps) {
  if (!quality && busy) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="analytics-quality-loading">
        Carregando indicadores de qualidade…
      </p>
    );
  }
  if (!quality) return null;

  return (
    <section
      className="rounded-lg border bg-card p-4 shadow-sm space-y-4"
      data-testid="analytics-quality-panel"
    >
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Indicadores de Qualidade</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Aceitação sugestões" value={pct(quality.suggestionAcceptanceRate)} />
        <Metric label="Taxa de edição" value={pct(quality.editRate)} />
        <Metric label="Taxa de rejeição" value={pct(quality.rejectionRate)} />
        <Metric label="Precisão OCR" value={pct(quality.ocrAccuracyAvg)} icon={ScanLine} />
        <Metric label="Precisão Parser" value={pct(quality.parserAccuracyAvg)} icon={Target} />
        <Metric
          label="Tempo médio revisão"
          value={formatProcessingDuration(quality.avgReviewTimeMs)}
        />
        <Metric
          label="Tempo médio aprovação"
          value={formatProcessingDuration(quality.avgApprovalTimeMs)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankList
          title="Top regras (glosas)"
          empty="Nenhuma regra registrada."
          rows={quality.topGlosaRules.map((r) => ({
            key: r.ruleId,
            label: r.ruleId,
            value: r.count,
          }))}
        />
        <RankList
          title="Top campos corrigidos"
          empty="Nenhum campo registrado."
          rows={quality.topCorrectedFields.map((r) => ({
            key: r.field,
            label: r.field,
            value: r.count,
          }))}
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof ScanLine;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function RankList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ key: string; label: string; value: number }>;
  empty: string;
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.slice(0, 10).map((row) => (
            <li key={row.key} className="flex justify-between gap-2">
              <span className="truncate font-mono text-xs">{row.label}</span>
              <span className="font-medium tabular-nums">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
