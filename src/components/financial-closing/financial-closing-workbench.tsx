import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { EmptyState, ErrorState, PageHeader, StatCard } from "@/components/ui-kit";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { can } from "@/lib/auth/rbac";
import type { AuthContext } from "@/lib/auth/types";
import type {
  FinancialClosingRow,
  FinancialClosingStatus,
} from "@/lib/services/financial-closing/types";
import {
  financialClosingsQueryOptions,
  useFinancialClosingDetailQuery,
  useFinancialClosingMutations,
  useFinancialClosingsQuery,
} from "@/hooks/use-financial-closing";
import { useToast } from "@/hooks/use-toast";
import { defaultCompetenceMonthUtc } from "@/hooks/use-medical-payout-foundation";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Download,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { downloadAuditRowsCsv } from "@/lib/services/export/export-service";

const STATUS_OPTIONS: readonly FinancialClosingStatus[] = [
  "draft",
  "under_review",
  "validated",
  "locked",
  "finalized",
] as const;

const ROW_GRID =
  "grid grid-cols-[40px_minmax(120px,1.35fr)_minmax(100px,1fr)_minmax(88px,0.95fr)_minmax(88px,0.95fr)_minmax(96px,1fr)_72px] gap-1 items-center";

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function statusLabel(s: FinancialClosingStatus): string {
  const m: Record<FinancialClosingStatus, string> = {
    draft: "Rascunho",
    under_review: "Em conferência",
    validated: "Validado",
    locked: "Travado",
    finalized: "Finalizado",
  };
  return m[s] ?? s;
}

function statusBadgeClass(s: FinancialClosingStatus): string {
  if (s === "finalized") return "bg-destructive/15 text-destructive";
  if (s === "locked") return "bg-[color:var(--warning)]/15 text-[color:var(--warning)]";
  if (s === "validated") return "bg-[color:var(--success)]/15 text-[color:var(--success)]";
  if (s === "under_review") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

function competenceLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

function closingIsImmutable(s: FinancialClosingStatus): boolean {
  return s === "locked" || s === "finalized";
}

type Props = { auth: AuthContext };

export function FinancialClosingWorkbench({ auth }: Props) {
  const role = auth.profile?.role ?? null;
  const canRead = can(role, "financial_closing:read");
  const canWrite = can(role, "financial_closing:write");
  const canReopen = can(role, "financial_closing:reopen");

  const [searchDraft, setSearchDraft] = useState("");
  const debouncedGlobalFilter = useDebouncedValue(searchDraft, 280);
  const [sorting, setSorting] = useState<SortingState>([{ id: "competence_month", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareAgainstId, setCompareAgainstId] = useState<string | null>(null);
  const [compInput, setCompInput] = useState(defaultCompetenceMonthUtc());

  const listQ = useFinancialClosingsQuery();
  const detailQ = useFinancialClosingDetailQuery(selectedId);
  const m = useFinancialClosingMutations();
  const toast = useToast();

  const columns = useMemo<ColumnDef<FinancialClosingRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-border"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) {
                el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
              }
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-border"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Selecionar"
          />
        ),
        enableSorting: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: "competence_month",
        header: "Competência",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {competenceLabel(getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, _id, value: unknown) => {
          const v = value as FinancialClosingStatus[] | undefined;
          if (!v || v.length === 0) return true;
          return v.includes(row.original.status);
        },
        cell: ({ getValue }) => {
          const s = getValue() as FinancialClosingStatus;
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusBadgeClass(s),
              )}
            >
              {statusLabel(s)}
            </span>
          );
        },
      },
      {
        accessorKey: "total_approved",
        header: () => <span className="text-right block w-full">Aprovado</span>,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block w-full">
            {moneyBrl(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: "total_payouts",
        header: () => <span className="text-right block w-full">Repasses</span>,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block w-full">
            {moneyBrl(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: "operational_difference",
        header: () => <span className="text-right block w-full">Dif. oper.</span>,
        cell: ({ getValue }) => {
          const v = Number(getValue());
          return (
            <span
              className={cn(
                "tabular-nums text-right block w-full font-medium",
                Math.abs(v) < 0.01
                  ? "text-muted-foreground"
                  : v > 0
                    ? "text-[color:var(--warning)]"
                    : "text-primary",
              )}
            >
              {moneyBrl(v)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            onClick={() => setSelectedId(row.original.id)}
          >
            Painel
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [],
  );

  const statusColumnFilter = columnFilters.find((f) => f.id === "status")?.value as
    | FinancialClosingStatus[]
    | undefined;

  const toggleStatusFilter = (s: FinancialClosingStatus) => {
    const cur = statusColumnFilter ?? [];
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    setColumnFilters((prev) => {
      const rest = prev.filter((f) => f.id !== "status");
      return next.length ? [...rest, { id: "status", value: next }] : rest;
    });
  };

  const table = useReactTable({
    data: listQ.data ?? [],
    columns,
    state: { sorting, globalFilter: debouncedGlobalFilter, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _cid, filter) => {
      const q = String(filter).toLowerCase();
      if (!q) return true;
      const r = row.original;
      return (
        r.competence_month.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    },
  });

  const rows = table.getRowModel().rows;
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });

  const auditList = detailQ.data?.audit ?? [];
  const auditParentRef = useRef<HTMLDivElement>(null);
  const auditVirtualizer = useVirtualizer({
    count: auditList.length,
    getScrollElement: () => auditParentRef.current,
    estimateSize: () => 44,
    overscan: 6,
  });

  if (!canRead) {
    return (
      <EmptyState
        title="Sem permissão para fechamento financeiro"
        description="Peça acesso de leitura financeira ao administrador do tenant."
      />
    );
  }

  if (listQ.isError) {
    return (
      <ErrorState
        message={describeError(listQ.error).message}
        onRetry={() => void listQ.refetch()}
      />
    );
  }

  const selected = detailQ.data?.closing;
  const bundle = detailQ.data?.bundle;
  const bundleFromSnapshot = !!selected && closingIsImmutable(selected.status) && !!bundle;

  const selectedIdsForBulk = table.getFilteredSelectedRowModel().flatRows.map((r) => r.original.id);

  const anchorCompareId = selectedId ?? selectedIdsForBulk[0] ?? null;
  const baseCompareRow = anchorCompareId
    ? (listQ.data?.find((r) => r.id === anchorCompareId) ?? null)
    : null;
  const otherCompareRow = compareAgainstId
    ? (listQ.data?.find((r) => r.id === compareAgainstId) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechamento financeiro operacional"
        subtitle="Competência, consolidação TISS/repasses, snapshots e travamento — base para conciliação futura."
        actions={
          <Link
            to="/financeiro"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Visão geral financeiro
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar competência, status ou id (com debounce)…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-2.5 text-sm ring-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="month"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            value={compInput.slice(0, 7)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setCompInput(`${v}-01`);
            }}
          />
          <button
            type="button"
            disabled={!canWrite || m.ensureDraft.isPending}
            onClick={() => m.ensureDraft.mutate(compInput)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <CalendarClock className="h-4 w-4" />
            Abrir competência
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Status
        </span>
        {STATUS_OPTIONS.map((s) => {
          const active = statusColumnFilter?.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatusFilter(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60",
              )}
            >
              {statusLabel(s)}
            </button>
          );
        })}
        {(statusColumnFilter?.length ?? 0) > 0 && (
          <button
            type="button"
            className="text-xs text-primary font-medium"
            onClick={() => setColumnFilters((p) => p.filter((f) => f.id !== "status"))}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Competências (filtro atual)"
          value={rows.length}
          hint={`${listQ.data?.length ?? 0} no tenant`}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Painel"
          value={selected ? competenceLabel(selected.competence_month) : "—"}
          tone="primary"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Dif. operacional (painel)"
          value={selected ? moneyBrl(Number(selected.operational_difference)) : "—"}
          hint="aprovado − repasses"
          icon={<ArrowRightLeft className="h-4 w-4" />}
        />
        <StatCard
          label="Snapshots (painel)"
          value={detailQ.data?.snapshots.length ?? "—"}
          icon={<Lock className="h-4 w-4" />}
        />
      </div>

      {baseCompareRow && (
        <div className="rounded-xl border border-border bg-card p-4 ring-soft space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comparar competências
              </p>
              <p className="text-sm text-muted-foreground">
                Base:{" "}
                <span className="font-medium text-foreground">
                  {competenceLabel(baseCompareRow.competence_month)}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="fc-compare">
                Comparar com
              </label>
              <select
                id="fc-compare"
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm min-w-[160px]"
                value={compareAgainstId ?? ""}
                onChange={(e) => setCompareAgainstId(e.target.value || null)}
              >
                <option value="">— selecione —</option>
                {(listQ.data ?? [])
                  .filter((r) => r.id !== baseCompareRow.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {competenceLabel(r.competence_month)} · {statusLabel(r.status)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {otherCompareRow && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg border border-border p-2">
                <div className="text-muted-foreground">Δ Aprovado</div>
                <div className="font-semibold tabular-nums">
                  {moneyBrl(
                    Number(baseCompareRow.total_approved) - Number(otherCompareRow.total_approved),
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border p-2">
                <div className="text-muted-foreground">Δ Repasses</div>
                <div className="font-semibold tabular-nums">
                  {moneyBrl(
                    Number(baseCompareRow.total_payouts) - Number(otherCompareRow.total_payouts),
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border p-2">
                <div className="text-muted-foreground">Δ Dif. oper.</div>
                <div className="font-semibold tabular-nums">
                  {moneyBrl(
                    Number(baseCompareRow.operational_difference) -
                      Number(otherCompareRow.operational_difference),
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border p-2">
                <div className="text-muted-foreground">Δ Guias</div>
                <div className="font-semibold tabular-nums">
                  {baseCompareRow.total_guides - otherCompareRow.total_guides}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canWrite && selectedIdsForBulk.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-medium">{selectedIdsForBulk.length} selecionado(s)</span>
          <button
            type="button"
            disabled={m.bulkOp.isPending}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            onClick={() =>
              m.bulkOp.mutate(
                { op: "refresh_totals", closingIds: selectedIdsForBulk },
                { onSuccess: () => table.resetRowSelection() },
              )
            }
          >
            Recalcular totais
          </button>
          <button
            type="button"
            disabled={m.bulkOp.isPending}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            onClick={() =>
              m.bulkOp.mutate(
                { op: "send_to_review", closingIds: selectedIdsForBulk },
                {
                  onSuccess: (res) => {
                    table.resetRowSelection();
                    if (res.skipped > 0) {
                      toast.info(
                        "Conferência em lote",
                        `${res.processed.length} rascunho(s) enviado(s). ${res.skipped} linha(s) ignoradas (não eram rascunho).`,
                      );
                    }
                  },
                },
              )
            }
          >
            Enviar conferência (rascunhos)
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => table.resetRowSelection()}
          >
            Limpar seleção
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden ring-soft">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/40">
          <h2 className="text-sm font-semibold">Fechamentos por competência</h2>
          <button
            type="button"
            className="text-xs font-medium text-primary inline-flex items-center gap-1"
            onClick={() => void listQ.refetch()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", listQ.isFetching && "animate-spin")} />
            Atualizar
          </button>
        </div>
        <div ref={tableScrollRef} className="max-h-[min(480px,55vh)] overflow-auto">
          <div className="min-w-[720px] text-sm">
            <div
              className={cn(
                ROW_GRID,
                "sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border text-muted-foreground text-xs uppercase tracking-wide px-2 py-2.5",
              )}
            >
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((h) => (
                  <div key={h.id} className="font-medium px-2">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </div>
                )),
              )}
            </div>
            {listQ.isLoading ? (
              <div className="px-4 py-10 text-center text-muted-foreground">Carregando…</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10">
                <EmptyState
                  title="Nenhum fechamento"
                  description="Abra uma competência ou ajuste filtros."
                />
              </div>
            ) : (
              <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {rowVirtualizer.getVirtualItems().map((vi) => {
                  const row = rows[vi.index];
                  if (!row) return null;
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        ROW_GRID,
                        "absolute left-0 right-0 border-b border-border px-2 py-1.5 hover:bg-muted/40",
                        selectedId === row.original.id && "bg-primary/5",
                      )}
                      style={{
                        height: `${vi.size}px`,
                        transform: `translateY(${vi.start}px)`,
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <div key={cell.id} className="min-w-0 px-1 flex items-center">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedId && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:bg-black/20"
          role="presentation"
          onClick={() => setSelectedId(null)}
        />
      )}
      <aside
        className={cn(
          "fixed z-50 bg-card border-border shadow-xl transition-transform duration-200 flex flex-col pointer-events-none",
          "inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl border-t lg:inset-y-4 lg:right-4 lg:left-auto lg:w-[min(440px,100%-2rem)] lg:rounded-xl lg:border lg:max-h-none",
          selectedId
            ? "translate-y-0 lg:translate-x-0 pointer-events-auto"
            : "translate-y-full lg:translate-x-[120%]",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Painel operacional
            </p>
            <p className="text-sm font-semibold">
              {selected ? competenceLabel(selected.competence_month) : "—"}
            </p>
            {bundleFromSnapshot && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Consolidação por convênio/profissional reidratada do snapshot (sem recálculo ao
                vivo).
              </p>
            )}
          </div>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-muted"
            onClick={() => setSelectedId(null)}
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {detailQ.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando detalhes…</p>
          )}
          {detailQ.isError && (
            <ErrorState
              message={describeError(detailQ.error).message}
              onRetry={() => void detailQ.refetch()}
            />
          )}
          {selected && detailQ.data && (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border p-2">
                  <div className="text-muted-foreground">Faturado</div>
                  <div className="font-semibold tabular-nums">
                    {moneyBrl(Number(selected.total_billed))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="text-muted-foreground">Glosado</div>
                  <div className="font-semibold tabular-nums">
                    {moneyBrl(Number(selected.total_denied))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="text-muted-foreground">Líquido aprov.</div>
                  <div className="font-semibold tabular-nums">
                    {moneyBrl(Number(selected.total_approved))}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <div className="text-muted-foreground">Guias</div>
                  <div className="font-semibold tabular-nums">{selected.total_guides}</div>
                </div>
              </div>

              {bundle && (
                <>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Por convênio (amostra)
                  </h3>
                  <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                    {bundle.by_provider.slice(0, 8).map((p) => (
                      <li key={p.insurance_provider_id} className="flex justify-between gap-2">
                        <span className="truncate">{p.provider_name}</span>
                        <span className="tabular-nums shrink-0">{moneyBrl(p.total_approved)}</span>
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Por profissional (amostra)
                  </h3>
                  <ul className="text-xs space-y-1 max-h-36 overflow-y-auto">
                    {bundle.by_professional.slice(0, 8).map((p) => (
                      <li key={p.professional_id} className="flex justify-between gap-2">
                        <span className="truncate">{p.display_name}</span>
                        <span className="tabular-nums shrink-0 text-muted-foreground">
                          Δ {moneyBrl(p.total_approved - p.payout_final_value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {!bundle && closingIsImmutable(selected.status) && (
                <p className="text-xs text-amber-700 dark:text-amber-400 border border-dashed border-amber-500/40 rounded-lg p-2">
                  Snapshot de consolidação indisponível para esta competência. Use auditoria ou
                  contate suporte se o travamento ocorreu antes da versão atual.
                </p>
              )}

              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Timeline financeira
              </h3>
              <ul className="text-xs space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-muted/20">
                {(detailQ.data.timeline ?? []).length === 0 ? (
                  <li className="text-muted-foreground">Sem eventos ainda.</li>
                ) : (
                  (detailQ.data.timeline ?? []).map((ev) => (
                    <li
                      key={ev.id}
                      className="border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="font-medium">{ev.event_type}</div>
                      <div className="text-muted-foreground line-clamp-2">{ev.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </div>
                    </li>
                  ))
                )}
              </ul>

              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Auditoria
                </h3>
                <button
                  type="button"
                  disabled={auditList.length === 0 || !selectedId}
                  onClick={() => {
                    downloadAuditRowsCsv(
                      `auditoria-fechamento-${selectedId!.slice(0, 8)}`,
                      auditList.map((a) => ({
                        id: a.id,
                        action: a.action,
                        actor_profile_id: a.actor_profile_id,
                        created_at: a.created_at,
                        payload:
                          a.payload == null
                            ? ""
                            : typeof a.payload === "string"
                              ? a.payload
                              : JSON.stringify(a.payload),
                      })),
                    );
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
              </div>
              {auditList.length === 0 ? (
                <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3">
                  Nenhum registro de auditoria ainda.
                </p>
              ) : (
                <div
                  ref={auditParentRef}
                  className="text-xs max-h-40 overflow-y-auto border border-border rounded-lg relative"
                >
                  <div
                    style={{ height: `${auditVirtualizer.getTotalSize()}px` }}
                    className="relative"
                  >
                    {auditVirtualizer.getVirtualItems().map((vi) => {
                      const a = auditList[vi.index];
                      if (!a) return null;
                      return (
                        <div
                          key={a.id}
                          className="absolute left-0 right-0 px-2 py-1 border-b border-border/50"
                          style={{ transform: `translateY(${vi.start}px)` }}
                        >
                          <div className="font-medium">{a.action}</div>
                          <div className="text-muted-foreground">
                            {new Date(a.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canWrite && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    disabled={
                      m.refreshTotals.isPending ||
                      selected.status === "locked" ||
                      selected.status === "finalized"
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
                    onClick={() => m.refreshTotals.mutate(selected.id)}
                  >
                    Recalcular totais
                  </button>
                  {selected.status === "draft" && (
                    <button
                      type="button"
                      className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({
                          closingId: selected.id,
                          toStatus: "under_review",
                        })
                      }
                    >
                      Enviar conferência
                    </button>
                  )}
                  {selected.status === "under_review" && (
                    <button
                      type="button"
                      className="rounded-lg bg-[color:var(--success)]/15 text-[color:var(--success)] px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({ closingId: selected.id, toStatus: "validated" })
                      }
                    >
                      Validar
                    </button>
                  )}
                  {selected.status === "validated" && (
                    <button
                      type="button"
                      className="rounded-lg bg-[color:var(--warning)]/15 text-[color:var(--warning)] px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({ closingId: selected.id, toStatus: "locked" })
                      }
                    >
                      Travar competência
                    </button>
                  )}
                  {selected.status === "locked" && (
                    <button
                      type="button"
                      className="rounded-lg bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({ closingId: selected.id, toStatus: "finalized" })
                      }
                    >
                      Finalizar
                    </button>
                  )}
                  {canReopen && selected.status === "locked" && (
                    <button
                      type="button"
                      className="rounded-lg border border-amber-500/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({
                          closingId: selected.id,
                          toStatus: "validated",
                          note: "unlock",
                        })
                      }
                    >
                      Desbloquear (admin)
                    </button>
                  )}
                  {canReopen && selected.status === "finalized" && (
                    <button
                      type="button"
                      className="rounded-lg border border-amber-500/40 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-xs font-medium"
                      onClick={() =>
                        m.transitionStatus.mutate({
                          closingId: selected.id,
                          toStatus: "under_review",
                          note: "reopen",
                        })
                      }
                    >
                      Reabrir (admin)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export function financialClosingRoutePrefetch(
  queryClient: import("@tanstack/react-query").QueryClient,
) {
  return queryClient.prefetchQuery(financialClosingsQueryOptions()).catch(() => undefined);
}
