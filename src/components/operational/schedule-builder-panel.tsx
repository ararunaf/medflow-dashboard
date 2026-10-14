/**
 * Montador de escala (coordenação): cria a escala de um setor e gera os
 * plantões em série — "todo dia das 19:00 às 07:00, de 01 a 30".
 *
 * Os plantões nascem como vagas abertas e aparecem no Pega Plantão.
 */
import { useMemo, useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
import { EmptyState, ErrorState, SkeletonRow } from "@/components/ui-kit";
import { useSchedulingTreeQuery } from "@/hooks/use-operations";
import { useCreateSchedule, useCreateShiftSeries } from "@/hooks/use-operational-mutations";
import { buildShiftSeries, type ShiftSeriesItem } from "@/lib/domain/operations/shift-series";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";

const INPUT = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const LABEL = "block text-xs font-medium text-muted-foreground mb-1";
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NEW_SCHEDULE = "__new__";

function monthBounds(): { first: string; last: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { first: fmt(first), last: fmt(last) };
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ScheduleBuilderPanel({ onClose }: { onClose: () => void }) {
  const treeQ = useSchedulingTreeQuery();
  const createSchedule = useCreateSchedule();
  const createSeries = useCreateShiftSeries();

  const defaults = useMemo(monthBounds, []);
  const [scheduleId, setScheduleId] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState(defaults.first);
  const [newEnd, setNewEnd] = useState(defaults.last);

  const [firstDate, setFirstDate] = useState(defaults.first);
  const [lastDate, setLastDate] = useState(defaults.last);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("19:00");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [roleRequired, setRoleRequired] = useState("");

  const tree = treeQ.data;
  const deptById = useMemo(
    () => new Map((tree?.departments ?? []).map((d) => [d.departmentId, d])),
    [tree],
  );
  const selected = tree?.schedules.find((s) => s.scheduleId === scheduleId) ?? null;

  const preview = useMemo((): { items: ShiftSeriesItem[] } | { error: string } => {
    try {
      const items = buildShiftSeries({ firstDate, lastDate, startTime, endTime, weekdays });
      if (selected && (firstDate < selected.startDate || lastDate > selected.endDate)) {
        return {
          error: `O período precisa estar dentro da escala (${formatDateBR(selected.startDate)} a ${formatDateBR(selected.endDate)}).`,
        };
      }
      return { items };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [firstDate, lastDate, startTime, endTime, weekdays, selected]);

  function selectSchedule(id: string) {
    setScheduleId(id);
    const s = tree?.schedules.find((x) => x.scheduleId === id);
    if (s) {
      setFirstDate(s.startDate);
      setLastDate(s.endDate);
    }
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  if (treeQ.isLoading) {
    return (
      <div className="mb-6 space-y-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }
  if (treeQ.isError) {
    return (
      <div className="mb-6">
        <ErrorState
          message={describeError(treeQ.error).message}
          onRetry={() => void treeQ.refetch()}
        />
      </div>
    );
  }
  if (!tree || tree.departments.length === 0) {
    return (
      <div className="mb-6">
        <EmptyState
          title="Nenhum setor cadastrado"
          description="A escala é criada por setor de um hospital. Cadastre hospital, unidade e setor antes de montar a escala."
        />
      </div>
    );
  }

  const creatingSchedule = scheduleId === NEW_SCHEDULE;
  const items = "items" in preview ? preview.items : [];
  const overnight = endTime <= startTime;

  return (
    <section
      aria-label="Montar escala"
      className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.03] p-4 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary" /> Montar escala
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Fechar
        </button>
      </div>

      {/* 1. Escala */}
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          1 · Escala
        </div>
        <div>
          <label className={LABEL} htmlFor="sb-schedule">
            Escala
          </label>
          <select
            id="sb-schedule"
            className={INPUT}
            value={scheduleId}
            onChange={(e) => selectSchedule(e.target.value)}
          >
            <option value="">Selecione…</option>
            {tree.schedules.map((s) => {
              const dept = deptById.get(s.departmentId);
              return (
                <option key={s.scheduleId} value={s.scheduleId}>
                  {s.name} — {dept ? `${dept.hospitalName} · ${dept.departmentName}` : "setor"} (
                  {formatDateBR(s.startDate)} a {formatDateBR(s.endDate)})
                </option>
              );
            })}
            <option value={NEW_SCHEDULE}>+ Nova escala…</option>
          </select>
        </div>

        {creatingSchedule ? (
          <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border bg-card p-3">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="sb-dept">
                Hospital e setor
              </label>
              <select
                id="sb-dept"
                className={INPUT}
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              >
                <option value="">Selecione…</option>
                {tree.departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.hospitalName} · {d.unitName} · {d.departmentName}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="sb-name">
                Nome da escala
              </label>
              <input
                id="sb-name"
                className={INPUT}
                placeholder="Ex.: Pronto-socorro — novembro"
                value={newName}
                maxLength={120}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-start">
                Início
              </label>
              <input
                id="sb-start"
                type="date"
                className={INPUT}
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-end">
                Fim
              </label>
              <input
                id="sb-end"
                type="date"
                className={INPUT}
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={
                  createSchedule.isPending ||
                  !newDept ||
                  !newName.trim() ||
                  !newStart ||
                  !newEnd ||
                  newEnd < newStart
                }
                onClick={() =>
                  createSchedule.mutate(
                    {
                      departmentId: newDept,
                      name: newName.trim(),
                      startDate: newStart,
                      endDate: newEnd,
                    },
                    {
                      onSuccess: (row) => {
                        setScheduleId(row.id);
                        setFirstDate(row.start_date);
                        setLastDate(row.end_date);
                        setNewName("");
                      },
                    },
                  )
                }
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {createSchedule.isPending ? "Criando…" : "Criar escala"}
              </button>
              {newEnd < newStart ? (
                <p className="mt-2 text-xs text-destructive">O fim é anterior ao início.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Plantões */}
      {selected ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            2 · Plantões
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={LABEL} htmlFor="sb-first">
                De
              </label>
              <input
                id="sb-first"
                type="date"
                className={INPUT}
                value={firstDate}
                min={selected.startDate}
                max={selected.endDate}
                onChange={(e) => setFirstDate(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-last">
                Até
              </label>
              <input
                id="sb-last"
                type="date"
                className={INPUT}
                value={lastDate}
                min={selected.startDate}
                max={selected.endDate}
                onChange={(e) => setLastDate(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-st">
                Entrada
              </label>
              <input
                id="sb-st"
                type="time"
                className={INPUT}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-et">
                Saída
              </label>
              <input
                id="sb-et"
                type="time"
                className={INPUT}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className={LABEL}>Dias da semana (nenhum marcado = todos)</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dias da semana">
                {WEEKDAYS.map((label, day) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={weekdays.includes(day)}
                    onClick={() => toggleWeekday(day)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium",
                      weekdays.includes(day)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL} htmlFor="sb-role">
                Função exigida (opcional)
              </label>
              <input
                id="sb-role"
                className={INPUT}
                placeholder="Ex.: Clínico geral"
                maxLength={60}
                value={roleRequired}
                onChange={(e) => setRoleRequired(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            {"error" in preview ? (
              <span className="text-destructive">{preview.error}</span>
            ) : (
              <span>
                <b>{items.length}</b> {items.length === 1 ? "plantão" : "plantões"} das {startTime}{" "}
                às {endTime}
                {overnight ? " (termina no dia seguinte)" : ""}, de {formatDateBR(firstDate)} a{" "}
                {formatDateBR(lastDate)}.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={createSeries.isPending || items.length === 0}
            onClick={() =>
              createSeries.mutate({
                scheduleId: selected.scheduleId,
                roleRequired: roleRequired.trim() || undefined,
                intervals: items.map(({ startsAt, endsAt }) => ({ startsAt, endsAt })),
              })
            }
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            {createSeries.isPending
              ? "Criando plantões…"
              : `Criar ${items.length || ""} ${items.length === 1 ? "plantão" : "plantões"}`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
