import { createFileRoute } from "@tanstack/react-router";
import { ContractRuleReviewPage } from "@/modules/capture/pages/ContractRuleReviewPage";
import { brandPageTitle } from "@/lib/assets";

export const Route = createFileRoute("/contratos/revisao/$contractId")({
  head: ({ params }) => ({
    meta: [
      { title: brandPageTitle("Revisão de Regras Contratuais") },
      {
        name: "description",
        content: `Revisão de propostas de regra — contrato ${params.contractId}.`,
      },
    ],
  }),
  component: ContractRuleReviewRoute,
});

function ContractRuleReviewRoute() {
  const { contractId } = Route.useParams();
  return <ContractRuleReviewPage operatorContractId={contractId} />;
}
