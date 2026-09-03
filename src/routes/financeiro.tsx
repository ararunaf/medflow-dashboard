import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { ContextualHintBanner } from "@/components/pilot-launch/contextual-hint-banner";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import { PageHeader } from "@/components/ui-kit";
import { onboardingIds } from "@/lib/services/onboarding";
import { ArrowRightLeft, LayoutDashboard, Users } from "lucide-react";

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

function FinanceiroPage() {
  return (
    <AppShell>
      <PageHeader title="Financeiro" subtitle="Central financeira" />

      <ContextualHintBanner
        hintId={onboardingIds.financeHubIntro}
        title="Hub financeiro — piloto V1"
        action={
          <Link
            to="/ajuda"
            search={{ tab: "doc", article: "doc-finance-hub" }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Guia do hub
          </Link>
        }
      >
        Percorra dashboard executivo, fechamento e conciliação antes da demo comercial.
      </ContextualHintBanner>

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
        <Link
          to="/financeiro/grupos-de-trabalho"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors ring-soft"
        >
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          Grupos de trabalho
          <span className="text-xs text-muted-foreground font-normal">
            produção e repasse por grupo
          </span>
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-muted/20 border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
        <strong className="text-foreground font-medium">Fluxo sugerido:</strong> consolidar no
        fechamento → conciliar recebíveis → acompanhar KPIs no dashboard executivo. Use exportações
        CSV nos painéis de auditoria e itens quando for auditar ou compartilhar com o time.
      </div>
    </AppShell>
  );
}
