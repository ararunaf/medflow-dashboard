import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatCard } from "@/components/ui-kit";
import {
  executiveDashboardBundleQueryOptions,
  useExecutiveDashboardBundleQuery,
} from "@/hooks/use-executive-dashboard";
import { describeError } from "@/lib/queries/result";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import { onboardingIds, readQuickStartStep, writeQuickStartStep } from "@/lib/services/onboarding";
import { useTenantBranding } from "@/components/tenant-branding-provider";
import { ArrowRight, Building2, ClipboardCheck, LayoutDashboard, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";

export const Route = createFileRoute("/executivo")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Início executivo") },
      {
        name: "description",
        content: "Resumo comercial, KPIs e ações rápidas para demo e implantação.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient
      .prefetchQuery(executiveDashboardBundleQueryOptions())
      .catch(() => undefined);
  },
  component: ExecutivoPage,
});

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function ExecutivoPage() {
  const dash = useExecutiveDashboardBundleQuery();
  const { settings } = useTenantBranding();
  const mounted = useClientMounted();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (!mounted) return;
    setStep(readQuickStartStep(onboardingIds.executiveQuickStart));
  }, [mounted]);

  const institution = useMemo(
    () => settings?.institution_name?.trim() || "Sua instituição",
    [settings?.institution_name],
  );

  return (
    <AppShell>
      <PageHeader
        title="Início executivo"
        subtitle={`${institution} · visão comercial e operacional da V1`}
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              to="/piloto"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Piloto comercial →
            </Link>
            <Link
              to="/ajuda"
              className="text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              Ajuda →
            </Link>
            <Link
              to="/instituicao"
              className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
            >
              Parametrização →
            </Link>
          </div>
        }
      />

      {step > 0 && step < 3 ? (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Onboarding executivo
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Passo {step} de 3 — explore o dashboard financeiro, a conciliação e a parametrização
                institucional antes da demo com cliente.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              onClick={() => {
                const next = Math.min(3, step + 1) as 0 | 1 | 2 | 3;
                writeQuickStartStep(onboardingIds.executiveQuickStart, next);
                setStep(next);
              }}
            >
              Avançar
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Link
          to="/financeiro/dashboard-executivo"
          className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors ring-soft text-left"
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick action
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            Dashboard financeiro
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </div>
        </Link>
        <Link
          to="/financeiro/conciliacao-operacional"
          className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors ring-soft text-left"
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick action
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Conciliação operacional
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </div>
        </Link>
        <Link
          to="/instituicao"
          className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors ring-soft text-left"
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick action
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            Branding e readiness
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </div>
        </Link>
        <Link
          to="/central"
          className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors ring-soft text-left"
        >
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick action
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Central de IA Operacional
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </div>
        </Link>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-card border border-border ring-soft">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Indicadores principais</h2>
            <button
              type="button"
              onClick={() => void dash.refetch()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {dash.isFetching ? "Atualizando…" : "Atualizar"}
            </button>
          </div>
          <div className="p-5">
            {dash.isLoading ? (
              <div className="space-y-2">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : dash.isError ? (
              <ErrorState
                message={describeError(dash.error).message}
                onRetry={() => void dash.refetch()}
              />
            ) : !dash.data ? (
              <EmptyState
                title="Sem dados agregados"
                description="Verifique competência e permissões."
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <StatCard
                  label="Divergência operacional |Δ|"
                  value={moneyBrl(dash.data.dashboard.financial_divergence_abs)}
                  tone="warning"
                />
                <StatCard
                  label="Alertas no digest"
                  value={dash.data.notifications.items.length}
                  hint="fechamento e conciliação"
                />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card ring-soft p-5 space-y-3">
          <h2 className="text-sm font-semibold">Experiência de implantação</h2>
          <p className="text-xs text-muted-foreground">
            Use a página Instituição para branding, checklist operacional e seed leve de convênios
            antes de apresentar ao cliente.
          </p>
          <div className="rounded-lg bg-muted/40 border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Motion leve, skeletons e empty states refinados aparecem nos fluxos de fechamento e
            conciliação — mantidos estáveis para demo em rede lenta.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
