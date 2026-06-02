import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import {
  OperationalReconciliationWorkbench,
  reconciliationRoutePrefetch,
} from "@/components/operational-reconciliation/reconciliation-workbench";

export const Route = createFileRoute("/financeiro/conciliacao-operacional")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Conciliação operacional") },
      {
        name: "description",
        content:
          "Esperado vs recebido, matching por lote/guia/convênio/competência/repasse, divergências e auditoria operacional.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await reconciliationRoutePrefetch(context.queryClient);
  },
  component: ConciliacaoOperacionalPage,
});

function ConciliacaoOperacionalPage() {
  const { auth } = Route.useRouteContext();
  return (
    <AppShell>
      <OperationalReconciliationWorkbench auth={auth} />
    </AppShell>
  );
}
