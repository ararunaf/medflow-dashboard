import { AlertCircle, CheckCircle2, FileJson, HelpCircle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STRUCTURED_GUIDE_GROUP_LABELS,
  type StructuredField,
  type StructuredFieldGroup,
  type StructuredFieldStatus,
  type StructuredGuide,
  type StructuredGuideSummary,
} from "@/lib/capture/parser";
import type { CapturePhase } from "../types";

export function CaptureStructuredGuidePanel({
  phase,
  summary,
  guide,
  onDownloadJson,
  busy,
}: {
  phase: CapturePhase;
  summary: StructuredGuideSummary | null;
  guide: StructuredGuide | null;
  onDownloadJson?: () => void;
  busy?: boolean;
}) {
  const showPanel =
    phase === "ocr_completed" ||
    phase === "parser_completed" ||
    phase === "auditing" ||
    phase === "completed" ||
    summary != null ||
    guide != null;

  if (!showPanel) return null;

  const status = summary?.status ?? (guide ? "completed" : "pending");
  const guideType = guide?.guideType ?? summary?.guideType;
  const guideTypeConfidence =
    guide?.classification.confidence ?? summary?.guideTypeConfidence;
  const overallConfidence = guide?.metadata.overallConfidence ?? summary?.overallConfidence;
  const fieldsFound = guide?.metadata.fieldsFound ?? summary?.fieldsFound;
  const fieldsMissing = guide?.metadata.fieldsMissing ?? summary?.fieldsMissing;
  const fieldsPartial = guide?.metadata.fieldsPartial ?? summary?.fieldsPartial;

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Campos Estruturados (TISS Parser)</h2>
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
            Baixar structured_guide.json
          </Button>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Metric label="Status Parser" value={statusLabel(status, phase, guide)} />
        <Metric label="Tipo de Guia" value={guideTypeLabel(guideType)} />
        <Metric
          label="Conf. Tipo"
          value={
            guideTypeConfidence != null
              ? `${(guideTypeConfidence * 100).toFixed(1)}%`
              : "—"
          }
        />
        <Metric
          label="Conf. Geral"
          value={
            overallConfidence != null ? `${(overallConfidence * 100).toFixed(1)}%` : "—"
          }
        />
        <Metric label="Encontrados" value={fieldsFound != null ? String(fieldsFound) : "—"} />
        <Metric label="Ausentes" value={fieldsMissing != null ? String(fieldsMissing) : "—"} />
        <Metric label="Parciais" value={fieldsPartial != null ? String(fieldsPartial) : "—"} />
        <Metric
          label="Tempo Parser"
          value={
            guide?.metadata.parserDurationMs != null
              ? `${guide.metadata.parserDurationMs} ms`
              : summary?.parserDurationMs != null
                ? `${summary.parserDurationMs} ms`
                : "—"
          }
        />
      </dl>

      {summary?.error ? (
        <p className="text-sm text-destructive">{summary.error}</p>
      ) : null}

      {!guide && phase === "ocr_completed" && status === "pending" ? (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <HelpCircle className="h-3 w-3 animate-pulse" />
          Aguardando interpretação TISS…
        </p>
      ) : null}

      {guide ? <FieldGroupsView guide={guide} /> : null}
    </section>
  );
}

function FieldGroupsView({ guide }: { guide: StructuredGuide }) {
  const groups = Object.entries(guide.groups).filter(
    ([, fields]) => fields.length > 0,
  ) as [StructuredFieldGroup, StructuredField[]][];

  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nenhum campo identificado no documento.</p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([groupKey, fields]) => (
        <div key={groupKey} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {STRUCTURED_GUIDE_GROUP_LABELS[groupKey]}
          </h3>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Campo</th>
                  <th className="px-3 py-2 font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium w-20">Conf.</th>
                  <th className="px-3 py-2 font-medium w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <FieldRow key={field.code} field={field} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {guide.procedures.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Linhas de Procedimento
          </h3>
          <div className="space-y-2">
            {guide.procedures.map((proc) => (
              <div
                key={proc.lineNumber}
                className="rounded-md border border-border p-3 space-y-1"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Linha {proc.lineNumber} — conf. {(proc.confidence * 100).toFixed(0)}%
                </p>
                {Object.values(proc.fields).map((field) => (
                  <FieldRow key={`${proc.lineNumber}-${field.code}`} field={field} compact />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldRow({ field, compact }: { field: StructuredField; compact?: boolean }) {
  return (
    <tr className={compact ? undefined : "border-t border-border/60"}>
      {!compact ? (
        <>
          <td className="px-3 py-2 font-medium">{field.label}</td>
          <td className="px-3 py-2 font-mono break-all">
            {field.value ?? field.rawValue ?? "—"}
          </td>
          <td className="px-3 py-2 font-mono">
            {(field.confidence * 100).toFixed(0)}%
          </td>
          <td className="px-3 py-2">
            <StatusBadge status={field.status} />
          </td>
        </>
      ) : (
        <td colSpan={4} className="py-1">
          <span className="font-medium">{field.label}: </span>
          <span className="font-mono">{field.value ?? field.rawValue ?? "—"}</span>
          <span className="ml-2 text-muted-foreground">
            ({(field.confidence * 100).toFixed(0)}%)
          </span>
          <StatusBadge status={field.status} className="ml-2" />
        </td>
      )}
    </tr>
  );
}

function StatusBadge({
  status,
  className,
}: {
  status: StructuredFieldStatus;
  className?: string;
}) {
  const config: Record<
    StructuredFieldStatus,
    { label: string; className: string; icon: typeof CheckCircle2 }
  > = {
    found: {
      label: "Encontrado",
      className: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle2,
    },
    missing: {
      label: "Ausente",
      className: "text-muted-foreground",
      icon: HelpCircle,
    },
    partial: {
      label: "Parcial",
      className: "text-amber-600 dark:text-amber-400",
      icon: AlertCircle,
    },
    duplicate: {
      label: "Duplicado",
      className: "text-orange-600 dark:text-orange-400",
      icon: AlertCircle,
    },
    out_of_position: {
      label: "Fora posição",
      className: "text-blue-600 dark:text-blue-400",
      icon: AlertCircle,
    },
  };

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className} ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
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

function statusLabel(
  status: StructuredGuideSummary["status"],
  phase: CapturePhase,
  guide: StructuredGuide | null,
): string {
  if (status === "completed" || guide) return "Concluído";
  if (status === "failed") return "Falhou";
  if (phase === "parser_completed") return "Concluído";
  return "Pendente";
}

function guideTypeLabel(type: string | undefined | null): string {
  switch (type) {
    case "guia_consulta":
      return "Guia Consulta";
    case "guia_sadt":
      return "Guia SP/SADT";
    case "guia_honorario":
      return "Honorário Individual";
    case "unknown":
      return "Desconhecido";
    default:
      return "—";
  }
}
