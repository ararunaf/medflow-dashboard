import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsDashboardPage } from "@/modules/capture/pages/AnalyticsDashboardPage";
import { brandPageTitle } from "@/lib/assets";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Analytics Executivo") },
      {
        name: "description",
        content:
          "Dashboard analítico e executivo — guias, risco, qualidade, operadoras e tendências do pipeline TISS.",
      },
    ],
  }),
  component: AnalyticsDashboardPage,
});
