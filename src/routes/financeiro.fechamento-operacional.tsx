import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import {
  FinancialClosingWorkbench,
  financialClosingRoutePrefetch,
} from "@/components/financial-closing/financial-closing-workbench";

export const Route = createFileRoute("/financeiro/fechamento-operacional")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Fechamento operacional") },
      {
        name: "description",
        content: "Consolidação por competência, snapshots e travamento financeiro operacional.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await financialClosingRoutePrefetch(context.queryClient);
  },
  component: FechamentoOperacionalPage,
});

function FechamentoOperacionalPage() {
  const { auth } = Route.useRouteContext();
  return (
    <AppShell>
      <FinancialClosingWorkbench auth={auth} />
    </AppShell>
  );
}
