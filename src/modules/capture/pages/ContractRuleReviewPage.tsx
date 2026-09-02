import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui-kit";
import { ContractRuleProposalCard } from "../components/ContractRuleProposalCard";
import { useContractRuleReview } from "../hooks/useContractRuleReview";

type Props = {
  operatorContractId: string;
};

export function ContractRuleReviewPage({ operatorContractId }: Props) {
  const { proposals, busy, reviewingId, error, review } = useContractRuleReview(operatorContractId);

  const pending = proposals.filter((p) => p.status === "pending");
  const reviewed = proposals.filter((p) => p.status !== "pending");

  return (
    <AppShell>
      <PageHeader
        title="Revisão de Regras Contratuais"
        subtitle="Cada regra abaixo foi proposta pelo Contract Knowledge Agent a partir do texto real do contrato — a citação mostra exatamente de onde ela veio. Nenhuma regra entra em produção sem aprovação humana."
        actions={
          <Link to="/contratos" className="text-xs font-medium text-primary hover:underline">
            Voltar para contratos
          </Link>
        }
      />

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {busy && proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Carregando propostas…</p>
      ) : null}

      {!busy && proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma proposta de regra ainda — rode a extração (F2-S2) para este contrato.
        </p>
      ) : null}

      {pending.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pendentes ({pending.length})
          </h2>
          {pending.map((p) => (
            <ContractRuleProposalCard key={p.id} proposal={p} busy={reviewingId === p.id} onReview={review} />
          ))}
        </section>
      ) : null}

      {reviewed.length > 0 ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Já revisadas ({reviewed.length})
          </h2>
          {reviewed.map((p) => (
            <ContractRuleProposalCard key={p.id} proposal={p} busy={reviewingId === p.id} onReview={review} />
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
