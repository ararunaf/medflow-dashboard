import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import { ExecutiveDashboardView } from "@/components/executive/executive-dashboard-view";
import { executiveDashboardRoutePrefetch } from "@/hooks/use-executive-dashboard";

export const Route = createFileRoute("/financeiro/dashboard-executivo")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Dashboard executivo") },
      {
        name: "description",
        content:
          "KPIs de faturamento, glosas, repasses, conciliação e fechamento — visão para demo e operação inicial.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await executiveDashboardRoutePrefetch(context.queryClient);
  },
  component: DashboardExecutivoPage,
});

function DashboardExecutivoPage() {
  const { auth } = Route.useRouteContext();
  return (
    <AppShell>
      <ExecutiveDashboardView auth={auth} />
    </AppShell>
  );
}
