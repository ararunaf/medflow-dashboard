import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { ContextualHintBanner } from "@/components/pilot-launch/contextual-hint-banner";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import { PageHeader, StatCard } from "@/components/ui-kit";
import { onboardingIds } from "@/lib/services/onboarding";
import { Wallet, TrendingUp, Clock, LayoutDashboard, ArrowRightLeft } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Financeiro") },
      { name: "description", content: "Resumo financeiro dos plantões." },
    ],
  }),
  component: FinanceiroPage,
});

const historico = [
  { date: "07/05", unit: "UTI Adulto", value: "R$ 2.400", status: "Pago" },
  { date: "05/05", unit: "Pronto Socorro", value: "R$ 1.350", status: "Pago" },
  { date: "02/05", unit: "Pediatria", value: "R$ 2.400", status: "Previsto" },
  { date: "30/04", unit: "Centro Cirúrgico", value: "R$ 2.800", status: "Pago" },
];

function FinanceiroPage() {
  return (
    <AppShell>
      <PageHeader title="Financeiro" subtitle="Resumo do mês" />

      <ContextualHintBanner
        hintId={onboardingIds.financeHubIntro}
        title="Hub financeiro — piloto V1"
        action={
          <>
            <Link
              to="/financeiro/dashboard-executivo"
              className="text-xs font-medium text-primary hover:underline mr-3"
            >
              Dashboard executivo
            </Link>
            <Link
              to="/ajuda"
              search={{ tab: "doc", article: "doc-finance-hub" }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Guia do hub
            </Link>
          </>
        }
      >
        Percorra dashboard executivo, fechamento e conciliação antes da demo comercial. KPIs reais
        estão no dashboard; valores desta landing são ilustrativos.
      </ContextualHintBanner>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard
          label="Recebido"
          value="R$ 12.450"
          tone="success"
          icon={<Wallet className="h-4 w-4" />}
          hint="abril/2026"
        />
        <StatCard
          label="Previsto"
          value="R$ 8.200"
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
          hint="próximas semanas"
        />
        <StatCard
          label="Em análise"
          value="R$ 1.450"
          icon={<Clock className="h-4 w-4" />}
          hint="2 plantões"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/financeiro/dashboard-executivo"
          className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors ring-soft"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard executivo
          <span className="text-xs text-muted-foreground font-normal">
            KPIs · exportações · alertas
          </span>
        </Link>
        <Link
          to="/financeiro/fechamento-operacional"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors ring-soft"
        >
          Fechamento operacional por competência
          <span className="text-xs text-muted-foreground font-normal">
            TISS · repasses · snapshots
          </span>
        </Link>
        <Link
          to="/financeiro/conciliacao-operacional"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors ring-soft"
        >
          <ArrowRightLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
          Conciliação operacional
          <span className="text-xs text-muted-foreground font-normal">
            esperado vs recebido · matching · divergências
          </span>
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-muted/20 border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
        <strong className="text-foreground font-medium">Fluxo sugerido:</strong> consolidar no
        fechamento → conciliar recebíveis → acompanhar KPIs no dashboard executivo. Use exportações
        CSV nos painéis de auditoria e itens quando for auditar ou compartilhar com o time.
      </div>

      <div className="mt-6 rounded-xl bg-card border border-border ring-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Histórico</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Data</th>
                <th className="text-left font-medium px-5 py-3">Unidade</th>
                <th className="text-right font-medium px-5 py-3">Valor</th>
                <th className="text-right font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {historico.map((h, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-foreground">{h.date}</td>
                  <td className="px-5 py-3 text-foreground">{h.unit}</td>
                  <td className="px-5 py-3 text-right font-medium">{h.value}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={
                        h.status === "Pago"
                          ? "text-[color:var(--success)] font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
