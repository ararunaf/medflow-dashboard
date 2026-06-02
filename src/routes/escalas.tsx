import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { shiftsRangeQueryOptions, useShiftsRangeQuery } from "@/hooks/use-operations";
import type { ShiftListItem } from "@/lib/operations/api";
import type { EscalasOpsSearch } from "@/lib/operations/actions";
import { formatDayMonth, formatTimeRange, shiftStatusToBadge } from "@/lib/queries/adapters";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

function parseEscalasSearch(search: Record<string, unknown>): EscalasOpsSearch {
  const f = search.opsFocus;
  if (f === "conflicts" || f === "abertos" || f === "sem-confirmacao") return { opsFocus: f };
  return {};
}

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Escalas") },
      { name: "description", content: "Calendário e timeline operacional." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): EscalasOpsSearch => parseEscalasSearch(search),
  loader: async ({ context }) => {
    await context.queryClient
      .prefetchQuery(shiftsRangeQueryOptions(undefined, undefined))
      .catch(() => undefined);
  },
  component: EscalasPage,
});

const RANGE_DAYS = 14;

function buildDays(): { iso: string; day: number; isToday: boolean }[] {
  const out: { iso: string; day: number; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < RANGE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      isToday: i === 0,
    });
  }
  return out;
}

function filterShiftsForOpsFocus(
  list: ShiftListItem[],
  opsFocus: EscalasOpsSearch["opsFocus"],
): ShiftListItem[] {
  if (!opsFocus) return list;
  if (opsFocus === "abertos") return list.filter((s) => s.status === "open");
  if (opsFocus === "sem-confirmacao") return list.filter((s) => !s.confirmedProfessionalId);
  if (opsFocus === "conflicts") return list.filter((s) => s.operationalConflictHint);
  return list;
}

function EscalasPage() {
  const days = useMemo(buildDays, []);
  const [selectedISO, setSelectedISO] = useState<string>(days[0]!.iso);
  const { opsFocus } = Route.useSearch();
  const navigate = useNavigate({ from: "/escalas" });

  const shiftsQuery = useShiftsRangeQuery();

  const filtered = useMemo(() => {
    const list = shiftsQuery.data ?? [];
    const byDay = list.filter((s) => s.startsAt.slice(0, 10) === selectedISO);
    return filterShiftsForOpsFocus(byDay, opsFocus);
  }, [shiftsQuery.data, selectedISO, opsFocus]);

  const filterLabel =
    opsFocus === "conflicts"
      ? "Conflitos"
      : opsFocus === "abertos"
        ? "Abertos"
        : opsFocus === "sem-confirmacao"
          ? "Sem confirmação"
          : null;

  return (
    <AppShell>
      <PageHeader
        title="Escalas"
        subtitle="Próximos 14 dias"
        actions={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        }
      />

      {opsFocus ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 px-3 py-2 text-xs">
          <span className="font-medium text-foreground">Foco operacional: {filterLabel}</span>
          <button
            type="button"
            className="ml-auto text-[11px] font-semibold text-primary hover:underline"
            onClick={() => void navigate({ search: {}, replace: true })}
          >
            Limpar filtro
          </button>
        </div>
      ) : null}

      <div className="rounded-xl bg-card border border-border ring-soft p-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {days.map((d) => {
            const active = d.iso === selectedISO;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedISO(d.iso)}
                className={`flex flex-col items-center justify-center w-12 h-16 rounded-lg text-xs transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent/30"
                }`}
              >
                <span className="opacity-70">{d.isToday ? "Hoje" : "Mai"}</span>
                <span className="text-base font-semibold">{d.day}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {shiftsQuery.isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : shiftsQuery.isError ? (
          <ErrorState
            message={describeError(shiftsQuery.error).message}
            onRetry={() => shiftsQuery.refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={opsFocus ? "Nada neste filtro nesta data" : "Sem plantões nesta data"}
            description={
              opsFocus
                ? "Tente outro dia ou remova o filtro operacional."
                : "Selecione outro dia para visualizar a escala."
            }
          />
        ) : (
          filtered.map((s) => (
            <Link
              key={s.shiftId}
              to="/plantoes"
              search={{ tab: s.status === "open" ? "disponiveis" : "meus" }}
              className={cn(
                "block rounded-xl bg-card border ring-soft p-4 transition-colors",
                s.operationalConflictHint
                  ? "border-[color:var(--warning)]/50 hover:border-[color:var(--warning)]"
                  : "border-border hover:border-[color:var(--secondary)]",
              )}
            >
              <div className="flex items-start gap-4">
                <div className="text-center shrink-0">
                  <div className="text-xs text-muted-foreground">{formatDayMonth(s.startsAt)}</div>
                  <div className="text-sm font-semibold mt-0.5">
                    {formatTimeRange(s.startsAt, s.endsAt).split(" ")[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {s.departmentName}
                    </h3>
                    <StatusBadge
                      status={shiftStatusToBadge(s.status, !!s.confirmedProfessionalId)}
                    />
                    {s.pendingAssignmentCount > 1 ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--warning)]">
                        múltiplas pendências
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeRange(s.startsAt, s.endsAt)}
                    {" · "}
                    {s.confirmedProfessionalName ?? "Sem confirmação"}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
