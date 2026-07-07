import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ReviewWorkspacePage } from "@/modules/capture/pages/ReviewWorkspacePage";
import { brandPageTitle } from "@/lib/assets";
import type { ProcessingQueueId } from "@/lib/capture/processing";
import { PROCESSING_QUEUE_IDS } from "@/lib/capture/processing";

type ReviewSearch = {
  returnTo?: string;
  queue?: ProcessingQueueId;
};

export const Route = createFileRoute("/captura/revisao/$sessionId")({
  validateSearch: (search: Record<string, unknown>): ReviewSearch => {
    const returnTo =
      typeof search.returnTo === "string" && search.returnTo.startsWith("/")
        ? search.returnTo
        : undefined;
    const queue =
      typeof search.queue === "string" &&
      (PROCESSING_QUEUE_IDS as readonly string[]).includes(search.queue)
        ? (search.queue as ProcessingQueueId)
        : undefined;
    return { returnTo, queue };
  },
  head: ({ params }) => ({
    meta: [
      { title: brandPageTitle("Revisão de Guia") },
      {
        name: "description",
        content: `Workspace de revisão da guia — sessão ${params.sessionId}.`,
      },
    ],
  }),
  component: ReviewWorkspaceRoute,
});

function ReviewWorkspaceRoute() {
  const { sessionId } = Route.useParams();
  const { returnTo, queue } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <ReviewWorkspacePage
      sessionId={sessionId}
      returnTo={returnTo}
      queue={queue}
      onApprovalComplete={() => {
        if (returnTo) {
          void navigate({
            to: returnTo,
            search: queue ? { queue } : undefined,
          });
        }
      }}
    />
  );
}
