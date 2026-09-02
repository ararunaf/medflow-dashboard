import { createFileRoute } from "@tanstack/react-router";
import { OperatorContractsListPage } from "@/modules/capture/pages/OperatorContractsListPage";
import { brandPageTitle } from "@/lib/assets";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Contratos de Operadora") },
      {
        name: "description",
        content: "Contratos de operadora indexados e propostas de regra aguardando revisão.",
      },
    ],
  }),
  component: OperatorContractsListPage,
});
