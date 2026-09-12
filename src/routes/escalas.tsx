import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Rows3 } from "lucide-react";
import { shiftsRangeQueryOptions, useShiftsRangeQuery } from "@/hooks/use-operations";
import type { ShiftListItem } from "@/lib/operations/api";
import type { EscalasOpsSearch } from "@/lib/operations/actions";
import {
  formatDayMonth,
  formatTimeRange,
  monthShortFromDate,
  shiftStatusToBadge,
} from "@/lib/queries/adapters";
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

function buildDays(): { iso: string; day: number; monthShort: string; isToday: boolean }[] {
  const out: { iso: string; day: number; monthShort: string; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < RANGE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      monthShort: monthShortFromDate(d),
      isToday: i === 0,
    });
  }
  return out;
}

const WEEKDAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type MonthCell = { iso: string; day: number; inMonth: boolean; isToday: boolean };

function buildMonthGrid(monthDate: Date): MonthCell[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const todayISO = new Date().toISOString().slice(0, 10);
  const cursor = new Date(year, month, 1 - startOffset);
  const weeks: MonthCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      week.push({
        iso,
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month,
        isToday: iso === todayISO,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatMonthYear(d: Date): string {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
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
  const [viewMode, setViewMode] = useState<"dias" | "mes">("dias");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const { opsFocus } = Route.useSearch();
  const navigate = useNavigate({ from: "/escalas" });

  const shiftsQuery = useShiftsRangeQuery(undefined, undefined, undefined, {
    enabled: viewMode === "dias",
  });

  const monthGrid = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const monthStartISO = monthGrid[0]![0]!.iso;
  const monthEndISO = monthGrid[monthGrid.length - 1]![6]!.iso;
  const monthShiftsQuery = useShiftsRangeQuery(monthStartISO, monthEndISO, undefined, {
    enabled: viewMode === "mes",
  });

  const monthDayInfo = useMemo(() => {
    const map = new Map<string, { total: number; open: number; conflict: boolean }>();
    for (const s of monthShiftsQuery.data ?? []) {
      const iso = s.startsAt.slice(0, 10);
      const entry = map.get(iso) ?? { total: 0, open: 0, conflict: false };
      entry.total += 1;
      if (s.status === "open") entry.open += 1;
      if (s.operationalConflictHint) entry.conflict = true;
      map.set(iso, entry);
    }
    return map;
  }, [monthShiftsQuery.data]);

  const activeQuery = viewMode === "mes" ? monthShiftsQuery : shiftsQuery;

  const filtered = useMemo(() => {
    const list = activeQuery.data ?? [];
    const byDay = list.filter((s) => s.startsAt.slice(0, 10) === selectedISO);
    return filterShiftsForOpsFocus(byDay, opsFocus);
  }, [activeQuery.data, selectedISO, opsFocus]);

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
        subtitle={viewMode === "dias" ? "Próximos 14 dias" : formatMonthYear(visibleMonth)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-muted rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setViewMode("dias")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "dias"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <Rows3 className="h-3.5 w-3.5" /> Dias
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === "mes"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Mês
              </button>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
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

      {viewMode === "dias" ? (
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
                  <span className="opacity-70">{d.isToday ? "Hoje" : d.monthShort}</span>
                  <span className="text-base font-semibold">{d.day}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border ring-soft p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              aria-label="Mês anterior"
              onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{formatMonthYear(visibleMonth)}</span>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  const now = new Date();
                  setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedISO(now.toISOString().slice(0, 10));
                }}
              >
                Hoje
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-label="Mês seguinte"
              onClick={() => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mb-1">
            {WEEKDAY_HEADERS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.flat().map((cell) => {
              const info = monthDayInfo.get(cell.iso);
              const active = cell.iso === selectedISO;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setSelectedISO(cell.iso)}
                  className={`flex flex-col items-center justify-start gap-0.5 rounded-lg py-1.5 text-xs transition-colors min-h-[52px] ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : cell.inMonth
                        ? "bg-muted hover:bg-accent/30 text-foreground"
                        : "text-muted-foreground/40"
                  } ${cell.isToday && !active ? "ring-1 ring-primary/50" : ""}`}
                >
                  <span className="font-semibold">{cell.day}</span>
                  {info ? (
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 text-[9px] font-semibold ${
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : info.conflict
                            ? "bg-[color:var(--warning)]/20 text-[color:var(--warning)]"
                            : info.open > 0
                              ? "bg-primary/15 text-primary"
                              : "bg-foreground/10 text-muted-foreground"
                      }`}
                    >
                      {info.total}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {activeQuery.isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : activeQuery.isError ? (
          <ErrorState
            message={describeError(activeQuery.error).message}
            onRetry={() => activeQuery.refetch()}
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
