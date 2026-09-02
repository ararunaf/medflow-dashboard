import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-kit";
import { useOperatorContractsForReview } from "../hooks/useOperatorContractsForReview";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Enviado",
  indexing: "Indexando",
  indexed: "Indexado",
  failed: "Falhou",
};

export function OperatorContractsListPage() {
  const { contracts, busy, error } = useOperatorContractsForReview();

  return (
    <AppShell>
      <PageHeader
        title="Contratos de Operadora"
        subtitle="Contratos indexados e suas propostas de regra aguardando revisão humana."
      />

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {busy && contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando contratos…</p>
      ) : null}

      {!busy && contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum contrato de operadora enviado ainda (rag:contract:index).
        </p>
      ) : null}

      <ul className="space-y-2">
        {contracts.map((c) => (
          <li key={c.id}>
            <Link
              to="/contratos/revisao/$contractId"
              params={{ contractId: c.id }}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{c.contractLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.operatorName ?? c.operatorCode} · {STATUS_LABELS[c.status] ?? c.status} ·{" "}
                    {c.chunkCount} chunk(s)
                  </p>
                </div>
              </div>
              {c.pendingProposals > 0 ? (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {c.pendingProposals} pendente(s)
                </span>
              ) : c.totalProposals > 0 ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  revisado
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
