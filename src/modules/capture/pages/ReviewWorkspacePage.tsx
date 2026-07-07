import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-kit";
import type { ProcessingQueueId } from "@/lib/capture/processing";
import { ReviewWorkspace } from "../components/ReviewWorkspace";
import { useReviewWorkspace } from "../hooks/useReviewWorkspace";

type ReviewWorkspacePageProps = {
  sessionId: string;
  returnTo?: string;
  queue?: ProcessingQueueId;
  onApprovalComplete?: () => void;
};

export function ReviewWorkspacePage({
  sessionId,
  returnTo,
  queue,
  onApprovalComplete,
}: ReviewWorkspacePageProps) {
  const workspace = useReviewWorkspace(sessionId);
  const returnedRef = useRef(false);

  useEffect(() => {
    if (!onApprovalComplete || returnedRef.current) return;
    const status = workspace.snapshot?.review.approvalStatus;
    if (status === "aprovada" || status === "reprovada") {
      returnedRef.current = true;
      onApprovalComplete();
    }
  }, [workspace.snapshot?.review.approvalStatus, onApprovalComplete]);

  const backHref = returnTo ?? "/captura";
  const backLabel = returnTo === "/processamento" ? "Voltar à Fila" : "Voltar à Captura";

  return (
    <AppShell>
      <PageHeader
        title="Revisão de Guia"
        subtitle="Workspace operacional unificado — OCR, Parser, Auditoria, Correções e Aprovação."
        actions={
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link
              to={backHref}
              search={returnTo === "/processamento" && queue ? { queue } : undefined}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          </Button>
        }
      />
      <ReviewWorkspace sessionId={sessionId} workspace={workspace} />
    </AppShell>
  );
}
