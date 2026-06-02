import { useMemo, useState } from "react";
import { EmptyState, ErrorState, StatCard } from "@/components/ui-kit";
import {
  useMedicalPayoutFoundationQuery,
  useMedicalPayoutMutations,
} from "@/hooks/use-medical-payout-foundation";
import type { MedicalPayoutStatus } from "@/lib/database.types";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";
import { Factory, HandCoins, RefreshCw, Trophy } from "lucide-react";

type ProfessionalLite = { id: string; specialty: string; crm: string; profile_id: string };

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function payoutStatusLabel(s: MedicalPayoutStatus): string {
  const m: Record<MedicalPayoutStatus, string> = {
    draft: "Rascunho",
    calculated: "Calculado",
    reviewed: "Revisado",
    approved: "Aprovado",
    paid: "Pago",
  };
  return m[s] ?? s;
}

function ruleTypeLabel(t: string): string {
  const m: Record<string, string> = {
    percentage: "Repasse %",
    fixed: "Repasse fixo",
    operational_discount: "Desconto operacional",
    retention_percentage: "Retenção %",
    retention_fixed: "Retenção fixa",
  };
  return m[t] ?? t;
}

function profLabel(professionals: ProfessionalLite[], id: string): string {
  const p = professionals.find((x) => x.id === id);
  if (!p) return id.slice(0, 8);
  return `${p.crm || "—"} · ${p.specialty || "—"}`;
}

type Props = {
  mode: "producao" | "repasses";
  competenceMonth: string;
  onCompetenceMonthChange: (v: string) => void;
  professionals: ProfessionalLite[];
  canPayoutWrite: boolean;
};

export function MedicalPayoutPanels(props: Props) {
  const { mode, competenceMonth, onCompetenceMonthChange, professionals, canPayoutWrite } = props;
  const q = useMedicalPayoutFoundationQuery(competenceMonth);
  const m = useMedicalPayoutMutations(competenceMonth);
  const [selProf, setSelProf] = useState<string>("");
  const [ruleType, setRuleType] = useState<string>("percentage");
  const [rulePct, setRulePct] = useState<string>("70");
  const [ruleFixed, setRuleFixed] = useState<string>("0");
  const [ruleSpecialty, setRuleSpecialty] = useState<string>("");

  const monthInput = competenceMonth.slice(0, 7);

  const rankingWithLabels = useMemo(() => {
    if (!q.data) return [];
    return q.data.ranking.map((r) => ({
      ...r,
      label: profLabel(professionals, r.professional_id),
    }));
  }, [q.data, professionals]);

  if (q.isError) {
    return <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />;
  }

  if (q.isLoading || !q.data) {
    return <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />;
  }

  const d = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Competência (mês)
          </div>
          <input
            type="month"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={monthInput}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onCompetenceMonthChange(`${v}-01`);
            }}
          />
        </div>
        {canPayoutWrite ? (
          <button
            type="button"
            disabled={m.syncProduction.isPending}
            onClick={() => m.syncProduction.mutate()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", m.syncProduction.isPending && "animate-spin")} />
            Sincronizar produção
          </button>
        ) : null}
      </div>

      {mode === "producao" ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Bruto (guias)"
              value={moneyBrl(d.totals.gross)}
              hint="competência"
              icon={<Factory className="h-4 w-4" />}
            />
            <StatCard
              label="Glosado"
              value={moneyBrl(d.totals.denied)}
              tone="warning"
              hint="TISS denials ≠ reversed"
            />
            <StatCard
              label="Aprovado operacional"
              value={moneyBrl(d.totals.approved)}
              tone="success"
              hint="base repasse"
            />
            <StatCard
              label="Guias (linhas)"
              value={d.productions.length}
              hint="medical_production"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Produção por guia</h2>
              </div>
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide sticky top-0">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Profissional</th>
                      <th className="text-right font-medium px-4 py-2">Bruto</th>
                      <th className="text-right font-medium px-4 py-2">Glosado</th>
                      <th className="text-right font-medium px-4 py-2">Aprovado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {d.productions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6">
                          <EmptyState
                            title="Sem produção nesta competência"
                            description="Sincronize após registrar guias TISS no período ou conferir o mês do lote."
                          />
                        </td>
                      </tr>
                    ) : (
                      d.productions.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-2 text-foreground">
                            {profLabel(professionals, row.professional_id)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {moneyBrl(Number(row.gross_value))}
                          </td>
                          <td className="px-4 py-2 text-right text-muted-foreground">
                            {moneyBrl(Number(row.denied_value))}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {moneyBrl(Number(row.approved_value))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Ranking (aprovado)</h2>
              </div>
              <ol className="p-3 space-y-2 text-sm max-h-[420px] overflow-y-auto">
                {rankingWithLabels.length === 0 ? (
                  <li className="text-muted-foreground px-1">Sem dados.</li>
                ) : (
                  rankingWithLabels.map((r, idx) => (
                    <li
                      key={r.professional_id}
                      className="flex justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-muted-foreground w-6 shrink-0">{idx + 1}º</span>
                      <span className="flex-1 truncate text-foreground" title={r.label}>
                        {r.label}
                      </span>
                      <span className="font-medium shrink-0">{moneyBrl(r.approved_total)}</span>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Repasse final (calculados+)"
              value={moneyBrl(d.totals.payoutFinal)}
              icon={<HandCoins className="h-4 w-4" />}
              hint="soma final_value em status ≥ calculado"
            />
            <StatCard
              label="Regras ativas"
              value={d.rules.filter((r) => r.active).length}
              hint="payout_rules"
            />
            <StatCard label="Repasses (linhas)" value={d.payouts.length} hint="medical_payouts" />
          </div>

          {canPayoutWrite ? (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Nova regra (MVP)</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <select
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                >
                  <option value="percentage">Repasse %</option>
                  <option value="fixed">Repasse fixo (teto)</option>
                  <option value="operational_discount">Desconto fixo sobre aprovado</option>
                  <option value="retention_percentage">Retenção % sobre repasse</option>
                  <option value="retention_fixed">Retenção fixa (R$)</option>
                </select>
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="% (repasse ou retenção)"
                  value={rulePct}
                  onChange={(e) => setRulePct(e.target.value)}
                  disabled={ruleType !== "percentage" && ruleType !== "retention_percentage"}
                />
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Valor fixo (R$)"
                  value={ruleFixed}
                  onChange={(e) => setRuleFixed(e.target.value)}
                  disabled={ruleType === "percentage" || ruleType === "retention_percentage"}
                />
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Especialidade (vazio = qualquer)"
                  value={ruleSpecialty}
                  onChange={(e) => setRuleSpecialty(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={m.createRule.isPending}
                onClick={() => {
                  const pct = Number(rulePct);
                  const fx = Number(ruleFixed);
                  m.createRule.mutate({
                    payoutType: ruleType,
                    payoutPercentage:
                      ruleType === "percentage" || ruleType === "retention_percentage" ? pct : null,
                    fixedValue:
                      ruleType === "fixed" ||
                      ruleType === "operational_discount" ||
                      ruleType === "retention_fixed"
                        ? fx
                        : null,
                    specialty: ruleSpecialty.trim() || "",
                  });
                }}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
              >
                Salvar regra
              </button>

              <div className="border-t border-border pt-4 mt-2 space-y-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  Rascunho de repasse por profissional
                </h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
                    value={selProf}
                    onChange={(e) => setSelProf(e.target.value)}
                  >
                    <option value="">Selecione…</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.crm} — {p.specialty}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selProf || m.ensureDraft.isPending}
                    onClick={() => m.ensureDraft.mutate(selProf)}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    Criar / abrir rascunho
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Repasses por profissional</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Profissional</th>
                    <th className="text-right font-medium px-4 py-2">Bruto</th>
                    <th className="text-right font-medium px-4 py-2">Glosa</th>
                    <th className="text-right font-medium px-4 py-2">Líquido</th>
                    <th className="text-right font-medium px-4 py-2">Retenção</th>
                    <th className="text-right font-medium px-4 py-2">Final</th>
                    <th className="text-right font-medium px-4 py-2">Status</th>
                    <th className="text-right font-medium px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.payouts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-muted-foreground">
                        Nenhum repasse nesta competência. Crie um rascunho para um profissional com
                        produção.
                      </td>
                    </tr>
                  ) : (
                    d.payouts.map((py) => (
                      <tr key={py.id}>
                        <td className="px-4 py-2">
                          {profLabel(professionals, py.professional_id)}
                        </td>
                        <td className="px-4 py-2 text-right">{moneyBrl(Number(py.gross_value))}</td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {moneyBrl(Number(py.denied_value))}
                        </td>
                        <td className="px-4 py-2 text-right">{moneyBrl(Number(py.net_value))}</td>
                        <td className="px-4 py-2 text-right">
                          {moneyBrl(Number(py.retention_value))}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {moneyBrl(Number(py.final_value))}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {payoutStatusLabel(py.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                          {canPayoutWrite && py.status === "draft" ? (
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/50"
                              disabled={m.calculate.isPending}
                              onClick={() => m.calculate.mutate({ payoutId: py.id })}
                            >
                              Calcular
                            </button>
                          ) : null}
                          {canPayoutWrite && py.status === "calculated" ? (
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/50"
                              disabled={m.markReviewed.isPending}
                              onClick={() => m.markReviewed.mutate(py.id)}
                            >
                              Revisar
                            </button>
                          ) : null}
                          {canPayoutWrite && py.status === "reviewed" ? (
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/50"
                              disabled={m.markApproved.isPending}
                              onClick={() => m.markApproved.mutate(py.id)}
                            >
                              Aprovar
                            </button>
                          ) : null}
                          {canPayoutWrite && py.status === "approved" ? (
                            <button
                              type="button"
                              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/50"
                              disabled={m.markPaid.isPending}
                              onClick={() => m.markPaid.mutate(py.id)}
                            >
                              Pagar
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Regras cadastradas</h2>
            <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
              {d.rules.length === 0 ? (
                <li className="text-muted-foreground">
                  Nenhuma regra — repasse assume 100% do aprovado por guia.
                </li>
              ) : (
                d.rules.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{ruleTypeLabel(r.payout_type)}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {r.payout_percentage != null ? `${r.payout_percentage}%` : ""}{" "}
                        {r.fixed_value != null ? moneyBrl(Number(r.fixed_value)) : ""}
                        {r.specialty ? ` · ${r.specialty}` : ""}
                      </span>
                    </div>
                    {canPayoutWrite ? (
                      <button
                        type="button"
                        className="text-xs rounded border border-border px-2 py-1 hover:bg-muted/50"
                        disabled={m.setRuleActive.isPending}
                        onClick={() => m.setRuleActive.mutate({ ruleId: r.id, active: !r.active })}
                      >
                        {r.active ? "Desativar" : "Ativar"}
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
