import { AlertTriangle, BookOpen, CheckCircle2, ListChecks, XCircle } from "lucide-react";
import type {
  FieldAuditOpinion,
  FieldAuditReport,
  FieldAuditSummaryMeta,
  FieldAuditVerdict,
} from "@/lib/capture/audit";
import type { StructuredGuide } from "@/lib/capture/parser";
import type { CapturePhase } from "../types";

const VERDICT_LABELS: Record<FieldAuditVerdict, string> = {
  critico: "Crítico",
  atencao: "Atenção",
  ok: "OK",
};

const VERDICT_STYLES: Record<FieldAuditVerdict, string> = {
  critico: "bg-destructive/15 text-destructive border-destructive/30",
  atencao: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-400 border-yellow-500/30",
  ok: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const VERDICT_ORDER: Record<FieldAuditVerdict, number> = { critico: 0, atencao: 1, ok: 2 };

/** Achados gerados por cláusula de contrato aprovada (contract-field-checks). */
function isContractRuleId(ruleId: string): boolean {
  return ruleId.startsWith("CTR-");
}

export function CaptureFieldAuditPanel({
  phase,
  summary,
  report,
  guide,
  selectedField,
  onSelectField,
}: {
  phase: CapturePhase;
  summary: FieldAuditSummaryMeta | null;
  report: FieldAuditReport | null;
  guide: StructuredGuide | null;
  selectedField?: string | null;
  onSelectField?: (field: string | null) => void;
}) {
  const status = summary?.status ?? (report ? "completed" : "pending");
  const opinions = [...(report?.opinions ?? [])].sort(
    (a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict],
  );
  const criticalCount = report?.summary.criticalCount ?? summary?.criticalCount ?? 0;
  const attentionCount = report?.summary.attentionCount ?? summary?.attentionCount ?? 0;
  const fieldLabel = (code: string) => guide?.fields[code]?.label ?? code;

  return (
    <section className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Parecer por Campo</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Para cada campo com achado, o agente cruza a regra estrutural TISS, a cláusula do contrato
        da operadora e o histórico de glosa. O veredito vem dos motores determinísticos — o agente
        só explica; a decisão final é do revisor.
      </p>

      {report ? (
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Campos com parecer" value={opinions.length} />
          <Metric label="Críticos" value={criticalCount} tone="text-destructive" />
          <Metric label="Atenção" value={attentionCount} tone="text-yellow-700 dark:text-yellow-400" />
        </div>
      ) : null}

      {!report && status === "pending" ? (
        <p className="text-xs text-muted-foreground">
          {phase === "completed"
            ? "Parecer ainda não gerado para esta guia."
            : "Aguardando auditoria, contrato e risco de glosa para gerar o parecer…"}
        </p>
      ) : null}

      {summary?.status === "failed" ? (
        <p className="text-sm text-destructive">
          Falha ao gerar o parecer{summary.error ? `: ${summary.error}` : "."}
        </p>
      ) : null}

      {report && opinions.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Nenhum campo com achado — nada a comentar.
        </div>
      ) : null}

      {opinions.length > 0 ? (
        <ul className="space-y-2">
          {opinions.map((opinion) => (
            <OpinionRow
              key={opinion.field}
              opinion={opinion}
              label={fieldLabel(opinion.field)}
              selected={selectedField === opinion.field}
              onSelect={
                onSelectField
                  ? () => onSelectField(selectedField === opinion.field ? null : opinion.field)
                  : undefined
              }
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function OpinionRow({
  opinion,
  label,
  selected,
  onSelect,
}: {
  opinion: FieldAuditOpinion;
  label: string;
  selected: boolean;
  onSelect?: () => void;
}) {
  const Icon = opinion.verdict === "critico" ? XCircle : AlertTriangle;
  return (
    <li
      className={`rounded-md border p-3 text-sm ${
        selected ? "border-primary ring-1 ring-primary/30" : "border-border"
      } ${onSelect ? "cursor-pointer hover:bg-muted/40" : ""}`}
      onClick={onSelect}
      data-testid={`field-opinion-${opinion.field}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[opinion.verdict]}`}
        >
          <Icon className="h-3 w-3" />
          {VERDICT_LABELS[opinion.verdict]}
        </span>
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{opinion.field}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          confiança {Math.round(opinion.confidence)}%
          {opinion.denialProbability != null
            ? ` · glosa ${Math.round(opinion.denialProbability * 100)}%`
            : ""}
        </span>
      </div>

      <p className="mt-2 text-sm">{opinion.explanation}</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {opinion.sourceRuleIds.map((ruleId) => (
          <span
            key={ruleId}
            className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${
              isContractRuleId(ruleId)
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
            title={isContractRuleId(ruleId) ? "Achado gerado por cláusula do contrato" : "Regra estrutural TISS/ANS"}
          >
            {ruleId}
          </span>
        ))}
      </div>

      {opinion.contractCitation ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{opinion.contractCitation}</span>
        </p>
      ) : null}
    </li>
  );
}
