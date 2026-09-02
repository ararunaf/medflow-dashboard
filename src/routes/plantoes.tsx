import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Check, Clock, MapPin, X } from "lucide-react";
import {
  myAssignmentsQueryOptions,
  openShiftsQueryOptions,
  useMyAssignmentsQuery,
  useOpenShiftsQuery,
  usePendingSwapsQuery,
  useSwapTargetProfessionalsQuery,
} from "@/hooks/use-operations";
import {
  useAcceptAssignment,
  useApproveSwap,
  useDenySwap,
  useRejectAssignment,
  useRequestSwap,
} from "@/hooks/use-operational-mutations";
import {
  assignmentStatusToBadge,
  formatDateShort,
  formatTimeRange,
  shiftStatusToBadge,
  swapStatusToBadge,
} from "@/lib/queries/adapters";
import type { AssignmentListItem, ShiftListItem, SwapListItem } from "@/lib/operations/api";
import type { PlantoesOpsSearch } from "@/lib/operations/actions";
import { describeError } from "@/lib/queries/result";
import { toast } from "@/lib/toast/bus";

function parsePlantoesSearch(search: Record<string, unknown>): PlantoesOpsSearch {
  const t = search.tab;
  const tab: NonNullable<PlantoesOpsSearch["tab"]> =
    t === "swaps" || t === "meus" || t === "disponiveis" ? t : "disponiveis";
  const rawFilter = search.assignmentFilter === "pending" ? ("pending" as const) : undefined;
  const assignmentFilter = tab === "meus" ? rawFilter : undefined;
  return { tab, assignmentFilter };
}

export const Route = createFileRoute("/plantoes")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Plantões") },
      { name: "description", content: "Aceite, recuse ou solicite trocas." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): PlantoesOpsSearch =>
    parsePlantoesSearch(search),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(openShiftsQueryOptions()),
      context.queryClient.prefetchQuery(myAssignmentsQueryOptions()),
    ]).catch(() => undefined);
  },
  component: PlantoesPage,
});

function PlantoesPage() {
  const { tab, assignmentFilter } = Route.useSearch();
  const navigate = useNavigate({ from: "/plantoes" });

  const openShifts = useOpenShiftsQuery({ enabled: tab === "disponiveis" });
  const myAssignments = useMyAssignmentsQuery({ enabled: tab === "meus" });
  const pendingSwaps = usePendingSwapsQuery({ enabled: tab === "swaps" });

  const onError = (err: unknown) => toast.error("Erro operacional", describeError(err).message);

  function setTab(next: NonNullable<PlantoesOpsSearch["tab"]>) {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: next,
        assignmentFilter: next === "meus" ? prev.assignmentFilter : undefined,
      }),
      replace: true,
    });
  }

  return (
    <AppShell>
      <PageHeader title="Plantões" subtitle="Workflow operacional" />

      <div className="inline-flex p-1 bg-muted rounded-lg mb-4 flex-wrap gap-1">
        {(
          [
            ["disponiveis", "Abertos"],
            ["meus", "Meus plantões"],
            ["swaps", "Swaps pendentes"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === key ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "disponiveis" ? (
        <DisponiveisList query={openShifts} onError={onError} />
      ) : tab === "meus" ? (
        <MeusList query={myAssignments} assignmentFilter={assignmentFilter} onError={onError} />
      ) : (
        <PendingSwapsList query={pendingSwaps} onError={onError} />
      )}
    </AppShell>
  );
}

function DisponiveisList({
  query,
  onError,
}: {
  query: ReturnType<typeof useOpenShiftsQuery>;
  onError: (err: unknown) => void;
}) {
  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow height={140} />
        <SkeletonRow height={140} />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState message={describeError(query.error).message} onRetry={() => query.refetch()} />
    );
  }
  const list = query.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        title="Nenhum plantão aberto"
        description="Assim que houver vagas abertas, elas aparecem aqui."
      />
    );
  }
  return (
    <div className="space-y-3">
      {list.map((s) => (
        <OpenShiftCard key={s.shiftId} shift={s} onError={onError} />
      ))}
    </div>
  );
}

function OpenShiftCard({
  shift,
  onError,
}: {
  shift: ShiftListItem;
  onError: (err: unknown) => void;
}) {
  return (
    <div className="rounded-xl bg-card border border-border ring-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{shift.departmentName}</h3>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatDateShort(shift.startsAt)} ·{" "}
              {formatTimeRange(shift.startsAt, shift.endsAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {shift.unitName ?? "—"}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <StatusBadge status={shiftStatusToBadge(shift.status, false)} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <p className="text-xs text-muted-foreground">
          Auto-atribuição via criação de atribuição confirmada requer ação do gestor. Solicite ao
          coordenador para confirmar este plantão.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled
          title="Disponível na próxima etapa (auto-atribuição direta)."
          onClick={() => onError(new Error("Auto-atribuição direta indisponível."))}
        >
          <Check className="h-4 w-4" /> Solicitar cobertura
        </Button>
      </div>
    </div>
  );
}

function MeusList({
  query,
  assignmentFilter,
  onError,
}: {
  query: ReturnType<typeof useMyAssignmentsQuery>;
  assignmentFilter?: "pending";
  onError: (err: unknown) => void;
}) {
  const navigate = useNavigate({ from: "/plantoes" });

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow height={140} />
        <SkeletonRow height={140} />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState message={describeError(query.error).message} onRetry={() => query.refetch()} />
    );
  }
  const list = query.data ?? [];
  const filtered =
    assignmentFilter === "pending" ? list.filter((a) => a.status === "pending") : list;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, assignmentFilter: undefined }),
              replace: true,
            })
          }
          className={`text-xs font-medium rounded-full px-2.5 py-1 border ${
            !assignmentFilter
              ? "border-primary text-primary bg-primary/5"
              : "border-border text-muted-foreground"
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() =>
            void navigate({
              search: (prev) => ({ ...prev, assignmentFilter: "pending" }),
              replace: true,
            })
          }
          className={`text-xs font-medium rounded-full px-2.5 py-1 border ${
            assignmentFilter === "pending"
              ? "border-[color:var(--warning)] text-[color:var(--warning)] bg-[color:var(--warning)]/8"
              : "border-border text-muted-foreground"
          }`}
        >
          Só pendentes
        </button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title={assignmentFilter === "pending" ? "Nada pendente" : "Você ainda não tem plantões"}
          description={
            assignmentFilter === "pending"
              ? "Nenhuma atribuição aguardando sua resposta."
              : "Atribuições aparecem aqui assim que o coordenador as criar."
          }
        />
      ) : (
        filtered.map((a) => (
          <AssignmentCard key={a.assignmentId} assignment={a} onError={onError} />
        ))
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onError,
}: {
  assignment: AssignmentListItem;
  onError: (err: unknown) => void;
}) {
  const accept = useAcceptAssignment();
  const reject = useRejectAssignment();
  const isBusy = accept.isPending || reject.isPending;
  const isFinal = assignment.status !== "pending";
  const [swapOpen, setSwapOpen] = useState(false);

  return (
    <div className="rounded-xl bg-card border border-border ring-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{assignment.shift.departmentName}</h3>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatDateShort(assignment.shift.startsAt)} ·{" "}
              {formatTimeRange(assignment.shift.startsAt, assignment.shift.endsAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {assignment.shift.unitName ?? "—"}
            </div>
          </div>
        </div>
        <StatusBadge status={assignmentStatusToBadge(assignment.status)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {assignment.status === "confirmed" ? (
          swapOpen ? (
            <div className="col-span-2">
              <SwapRequestForm
                shiftId={assignment.shiftId}
                onCancel={() => setSwapOpen(false)}
                onDone={() => setSwapOpen(false)}
                onError={onError}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="col-span-2 gap-1.5"
              onClick={() => setSwapOpen(true)}
            >
              <ArrowLeftRight className="h-4 w-4" /> Solicitar troca
            </Button>
          )
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isBusy || isFinal}
              onClick={() => reject.mutate({ assignmentId: assignment.assignmentId })}
            >
              <X className="h-4 w-4" />
              {reject.isPending ? "Recusando…" : "Recusar"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={isBusy || isFinal}
              onClick={() => accept.mutate({ assignmentId: assignment.assignmentId })}
            >
              <Check className="h-4 w-4" />
              {accept.isPending ? "Aceitando…" : "Aceitar"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function SwapRequestForm({
  shiftId,
  onCancel,
  onDone,
  onError,
}: {
  shiftId: string;
  onCancel: () => void;
  onDone: () => void;
  onError: (err: unknown) => void;
}) {
  const colleagues = useSwapTargetProfessionalsQuery();
  const requestSwap = useRequestSwap({ onSuccess: onDone, onError });
  const [targetId, setTargetId] = useState("");

  if (colleagues.isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Carregando colegas…</p>;
  }
  if (colleagues.isError) {
    return (
      <ErrorState
        message={describeError(colleagues.error).message}
        onRetry={() => colleagues.refetch()}
      />
    );
  }
  const options = colleagues.data ?? [];
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nenhum outro profissional cadastrado neste tenant para solicitar troca.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-medium text-muted-foreground"
        htmlFor={`swap-target-${shiftId}`}
      >
        Solicitar troca com
      </label>
      <select
        id={`swap-target-${shiftId}`}
        className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      >
        <option value="">Selecione um colega…</option>
        {options.map((p) => (
          <option key={p.professionalId} value={p.professionalId}>
            {p.name}
            {p.specialty ? ` — ${p.specialty}` : ""}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={requestSwap.isPending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1.5"
          disabled={!targetId || requestSwap.isPending}
          onClick={() => requestSwap.mutate({ shiftId, targetProfessionalId: targetId })}
        >
          <ArrowLeftRight className="h-4 w-4" />
          {requestSwap.isPending ? "Enviando…" : "Confirmar solicitação"}
        </Button>
      </div>
    </div>
  );
}

function PendingSwapsList({
  query,
  onError,
}: {
  query: ReturnType<typeof usePendingSwapsQuery>;
  onError: (err: unknown) => void;
}) {
  const approve = useApproveSwap();
  const deny = useDenySwap();

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow height={140} />
        <SkeletonRow height={140} />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState message={describeError(query.error).message} onRetry={() => query.refetch()} />
    );
  }
  const list = query.data ?? [];
  if (list.length === 0) {
    return (
      <EmptyState
        title="Nenhuma troca pendente"
        description="Novas solicitações aparecem aqui para aprovação da coordenação."
      />
    );
  }
  return (
    <div className="space-y-3">
      {list.map((s) => (
        <PendingSwapCard
          key={s.swapId}
          swap={s}
          busy={approve.isPending || deny.isPending}
          onApprove={() => approve.mutate({ swapId: s.swapId }, { onError: (e) => onError(e) })}
          onDeny={() => deny.mutate({ swapId: s.swapId }, { onError: (e) => onError(e) })}
        />
      ))}
    </div>
  );
}

function PendingSwapCard({
  swap,
  busy,
  onApprove,
  onDeny,
}: {
  swap: SwapListItem;
  busy: boolean;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="rounded-xl bg-card border border-border ring-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{swap.shift.departmentName}</h3>
          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatDateShort(swap.shift.startsAt)} ·{" "}
              {formatTimeRange(swap.shift.startsAt, swap.shift.endsAt)}
            </div>
            <div className="text-xs">
              {swap.requesterName ?? "?"} ↔ {swap.targetName ?? "?"}
            </div>
          </div>
        </div>
        <StatusBadge status={swapStatusToBadge(swap.status)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={onDeny}>
          Recusar
        </Button>
        <Button size="sm" disabled={busy} onClick={onApprove}>
          Aprovar
        </Button>
        <Link
          to="/escalas"
          className="inline-flex items-center justify-center h-8 rounded-md px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60"
        >
          Ver escala
        </Link>
      </div>
    </div>
  );
}
