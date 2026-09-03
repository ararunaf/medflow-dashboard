import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Building2, Check, Clock, MapPin, Sparkles, X } from "lucide-react";
import { can } from "@/lib/auth/rbac";
import { shiftDetailQueryOptions, useMyContextQuery, useShiftDetailQuery } from "@/hooks/use-operations";
import {
  useAcceptAssignment,
  useAssignProfessionalToShift,
  useCancelShift,
  useRejectAssignment,
  useSelfAssignOpenShift,
  useSuggestProfessionalsForShift,
} from "@/hooks/use-operational-mutations";
import {
  assignmentStatusToBadge,
  formatDateShort,
  formatTimeRange,
  shiftStatusToBadge,
  swapStatusToBadge,
} from "@/lib/queries/adapters";
import type { ShiftMatchSuggestion } from "@/lib/services/operations/shift-matching-agent";
import { describeError } from "@/lib/queries/result";
import { toast } from "@/lib/toast/bus";

export const Route = createFileRoute("/plantoes/$shiftId")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Detalhe do plantão") },
      { name: "description", content: "Histórico completo, gestão e sugestão de profissionais." },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient
      .prefetchQuery(shiftDetailQueryOptions(params.shiftId))
      .catch(() => undefined);
  },
  component: ShiftDetailPage,
});

function ShiftDetailPage() {
  const { shiftId } = Route.useParams();
  const { auth } = Route.useRouteContext();
  const role = auth.profile?.role ?? null;
  const isManager = can(role, "assignments:assign:any");
  const myContext = useMyContextQuery();
  const professionalId = myContext.data?.professionalId ?? null;

  const query = useShiftDetailQuery(shiftId);
  const onError = (err: unknown) => toast.error("Erro operacional", describeError(err).message);

  if (query.isLoading) {
    return (
      <AppShell>
        <PageHeader title="Detalhe do plantão" subtitle="Carregando…" />
        <div className="space-y-3">
          <SkeletonRow height={140} />
          <SkeletonRow height={200} />
        </div>
      </AppShell>
    );
  }
  if (query.isError) {
    return (
      <AppShell>
        <PageHeader title="Detalhe do plantão" subtitle="Erro" />
        <ErrorState message={describeError(query.error).message} onRetry={() => query.refetch()} />
      </AppShell>
    );
  }
  const shift = query.data;
  if (!shift) {
    return (
      <AppShell>
        <PageHeader title="Detalhe do plantão" subtitle="Não encontrado" />
        <EmptyState
          title="Plantão não encontrado"
          description="Ele pode ter sido removido, ou você não tem acesso a ele."
        />
        <Link to="/plantoes" className="text-sm text-primary underline">
          Voltar para plantões
        </Link>
      </AppShell>
    );
  }

  const myAssignment = professionalId
    ? shift.assignments.find((a) => a.professionalId === professionalId)
    : undefined;

  return (
    <AppShell>
      <PageHeader
        title={shift.departmentName}
        subtitle={`${shift.scheduleName} · Workflow operacional`}
      />

      <div className="rounded-xl bg-card border border-border ring-soft p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {formatDateShort(shift.startsAt)} ·{" "}
              {formatTimeRange(shift.startsAt, shift.endsAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {shift.unitName ?? "—"}
            </div>
            {shift.hospitalName ? (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {shift.hospitalName}
              </div>
            ) : null}
            {shift.roleRequired ? (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Exigência: </span>
                {shift.roleRequired}
              </div>
            ) : null}
          </div>
          <StatusBadge status={shiftStatusToBadge(shift.status, false)} />
        </div>

        <SelfServiceActions
          shiftId={shiftId}
          shiftStatus={shift.status}
          myAssignment={myAssignment}
          canSelfAssign={can(role, "assignments:assign:self")}
          onError={onError}
        />

        {isManager ? <CoordinatorActions shiftId={shiftId} shiftStatus={shift.status} onError={onError} /> : null}
      </div>

      {isManager && shift.status === "open" ? (
        <MatchingPanel shiftId={shiftId} onError={onError} />
      ) : null}

      <section className="mb-4">
        <h3 className="text-sm font-semibold mb-2">Atribuições</h3>
        {shift.assignments.length === 0 ? (
          <EmptyState title="Nenhuma atribuição" description="Ninguém foi atribuído a este plantão ainda." />
        ) : (
          <div className="space-y-2">
            {shift.assignments.map((a) => (
              <div
                key={a.assignmentId}
                className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between gap-3"
              >
                <span className="text-sm">{a.professionalName}</span>
                <StatusBadge status={assignmentStatusToBadge(a.status)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {shift.swaps.length > 0 ? (
        <section className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Trocas solicitadas</h3>
          <div className="space-y-2">
            {shift.swaps.map((s) => (
              <div
                key={s.swapId}
                className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between gap-3"
              >
                <span className="text-sm">
                  {s.requesterName ?? "?"} ↔ {s.targetName ?? "?"}
                </span>
                <StatusBadge status={swapStatusToBadge(s.status)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

function SelfServiceActions({
  shiftId,
  shiftStatus,
  myAssignment,
  canSelfAssign,
  onError,
}: {
  shiftId: string;
  shiftStatus: string;
  myAssignment: { assignmentId: string; status: string } | undefined;
  canSelfAssign: boolean;
  onError: (err: unknown) => void;
}) {
  const selfAssign = useSelfAssignOpenShift({ onError });
  const accept = useAcceptAssignment({ onError });
  const reject = useRejectAssignment({ onError });

  if (!canSelfAssign) return null;

  if (!myAssignment) {
    if (shiftStatus !== "open") return null;
    return (
      <div className="mt-4">
        <Button
          size="sm"
          className="gap-1.5"
          disabled={selfAssign.isPending}
          onClick={() => selfAssign.mutate({ shiftId })}
        >
          <Check className="h-4 w-4" />
          {selfAssign.isPending ? "Atribuindo…" : "Assumir plantão"}
        </Button>
      </div>
    );
  }

  if (myAssignment.status === "pending") {
    const busy = accept.isPending || reject.isPending;
    return (
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => reject.mutate({ assignmentId: myAssignment.assignmentId })}
        >
          <X className="h-4 w-4" /> Recusar
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => accept.mutate({ assignmentId: myAssignment.assignmentId })}
        >
          <Check className="h-4 w-4" /> Aceitar
        </Button>
      </div>
    );
  }

  return null;
}

function CoordinatorActions({
  shiftId,
  shiftStatus,
  onError,
}: {
  shiftId: string;
  shiftStatus: string;
  onError: (err: unknown) => void;
}) {
  const cancelShift = useCancelShift({ onError });
  const isTerminal = shiftStatus === "cancelled" || shiftStatus === "completed";
  if (isTerminal) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <Button
        variant="destructive"
        size="sm"
        className="gap-1.5"
        disabled={cancelShift.isPending}
        onClick={() => {
          if (!window.confirm("Cancelar este plantão? Atribuições e trocas pendentes serão encerradas.")) return;
          cancelShift.mutate({ shiftId });
        }}
      >
        {cancelShift.isPending ? "Cancelando…" : "Cancelar plantão"}
      </Button>
    </div>
  );
}

function MatchingPanel({ shiftId, onError }: { shiftId: string; onError: (err: unknown) => void }) {
  const suggest = useSuggestProfessionalsForShift({ onError });
  const assign = useAssignProfessionalToShift({ onError });
  const [suggestions, setSuggestions] = useState<ShiftMatchSuggestion[] | null>(null);

  return (
    <section className="mb-4 rounded-xl bg-card border border-border ring-soft p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4" /> Sugestão de profissionais
        </h3>
        <Button
          variant="outline"
          size="sm"
          disabled={suggest.isPending}
          onClick={() =>
            suggest.mutate(
              { shiftId },
              { onSuccess: (data) => setSuggestions(data) },
            )
          }
        >
          {suggest.isPending ? "Analisando…" : suggestions ? "Atualizar sugestões" : "Sugerir profissionais"}
        </Button>
      </div>

      {suggestions === null ? (
        <p className="text-xs text-muted-foreground">
          Cruza afiliação institucional, conflito de horário, especialidade e disponibilidade
          real dos profissionais do tenant — a IA só escreve a justificativa, nunca decide quem
          aparece na lista.
        </p>
      ) : suggestions.length === 0 ? (
        <EmptyState
          title="Nenhum candidato elegível"
          description="Ninguém combina com a afiliação institucional e a agenda deste plantão no momento."
        />
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div
              key={s.professionalId}
              className="rounded-lg border border-border px-3 py-2 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.professionalName}</p>
                <p className="text-xs text-muted-foreground">
                  {s.specialty || "Especialidade não informada"} · CRM {s.crm}
                </p>
                {s.rationale ? (
                  <p className="text-xs text-muted-foreground mt-1 italic">{s.rationale}</p>
                ) : null}
              </div>
              <Button
                size="sm"
                className="shrink-0"
                disabled={assign.isPending}
                onClick={() =>
                  assign.mutate({ shiftId, professionalId: s.professionalId })
                }
              >
                Atribuir
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
