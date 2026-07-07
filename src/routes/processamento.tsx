import { createFileRoute } from "@tanstack/react-router";
import { ProcessingCenterPage } from "@/modules/capture/pages/ProcessingCenterPage";
import { brandPageTitle } from "@/lib/assets";
import type { ProcessingQueueId } from "@/lib/capture/processing";
import { PROCESSING_QUEUE_IDS } from "@/lib/capture/processing";

export const Route = createFileRoute("/processamento")({
  validateSearch: (search: Record<string, unknown>) => {
    const queue =
      typeof search.queue === "string" &&
      (PROCESSING_QUEUE_IDS as readonly string[]).includes(search.queue)
        ? (search.queue as ProcessingQueueId)
        : undefined;
    return { queue };
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Centro de Processamento") },
      {
        name: "description",
        content:
          "Filas operacionais para revisão de guias TISS em escala — priorização por risco e impacto.",
      },
    ],
  }),
  component: ProcessingCenterRoute,
});

function ProcessingCenterRoute() {
  const { queue } = Route.useSearch();
  return <ProcessingCenterPage initialQueue={queue} />;
}
