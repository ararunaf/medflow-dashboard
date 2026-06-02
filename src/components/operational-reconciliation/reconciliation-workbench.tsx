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
import { can } from "@/lib/auth/rbac";
import type { AuthContext } from "@/lib/auth/types";
import type { OperationalReconciliationRow } from "@/lib/services/reconciliation/types";
import type { ReconciliationMatchingMode } from "@/lib/services/reconciliation/types";
import {
  operationalReconciliationsQueryOptions,
  useOperationalReconciliationDetailQuery,
  useOperationalReconciliationMutations,
  useOperationalReconciliationsQuery,
} from "@/hooks/use-operational-reconciliation";
import { defaultCompetenceMonthUtc } from "@/hooks/use-medical-payout-foundation";
import { useToast } from "@/hooks/use-toast";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { downloadAuditRowsCsv, downloadCsv } from "@/lib/services/export/export-service";

type ReconciliationStatus = OperationalReconciliationRow["status"];

const STATUS_OPTIONS: readonly ReconciliationStatus[] = [
  "draft",
  "processing",
  "reconciled",
  "divergent",
  "finalized",
] as const;

const MATCH_OPTIONS: readonly { id: ReconciliationMatchingMode; label: string }[] = [
  { id: "competence", label: "Competência" },
  { id: "payout", label: "Repasse" },
  { id: "batch", label: "Lote" },
  { id: "guide", label: "Guia" },
  { id: "insurance", label: "Convênio" },
] as const;

const ROW_GRID =
  "grid grid-cols-[40px_minmax(120px,1.2fr)_minmax(88px,0.9fr)_minmax(88px,0.9fr)_minmax(88px,0.9fr)_minmax(88px,0.9fr)_72px] gap-1 items-center";

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function statusLabel(s: ReconciliationStatus): string {
  const m: Record<ReconciliationStatus, string> = {
    draft: "Rascunho",
    processing: "Processando",
    reconciled: "Conciliado",
    divergent: "Divergente",
    finalized: "Finalizado",
  };
  return m[s] ?? s;
}

function statusBadgeClass(s: ReconciliationStatus): string {
  if (s === "finalized") return "bg-muted text-muted-foreground";
  if (s === "divergent") return "bg-destructive/15 text-destructive";
  if (s === "reconciled") return "bg-[color:var(--success)]/15 text-[color:var(--success)]";
  if (s === "processing") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
}

function competenceLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

type Props = { auth: AuthContext };

type PanelTab = "summary" | "items" | "issues" | "timeline" | "audit";

export function reconciliationRoutePrefetch(
  queryClient: import("@tanstack/react-query").QueryClient,
) {
  return queryClient.prefetchQuery(operationalReconciliationsQueryOptions()).catch(() => undefined);
}

export function OperationalReconciliationWorkbench({ auth }: Props) {
  const role = auth.profile?.role ?? null;
  const canRead = can(role, "financial_closing:read");
  const canWrite = can(role, "financial_closing:write");

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "competence_month", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compInput, setCompInput] = useState(defaultCompetenceMonthUtc());
  const [panelTab, setPanelTab] = useState<PanelTab>("summary");
  const [matchMode, setMatchMode] = useState<ReconciliationMatchingMode>("competence");
  const [csvDraft, setCsvDraft] = useState(
    "reference_type,reference_id,expected_value,received_value\ncsv_import_row,,0,1500.00\n",
  );
  const [manualRef, setManualRef] = useState("");
  const [manualExp, setManualExp] = useState("0");
  const [manualRec, setManualRec] = useState("0");

  const listQ = useOperationalReconciliationsQuery();
  const detailQ = useOperationalReconciliationDetailQuery(selectedId);
  const m = useOperationalReconciliationMutations();
  const toast = useToast();

  const columns = useMemo<ColumnDef<OperationalReconciliationRow>[]>(
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
          const v = value as ReconciliationStatus[] | undefined;
          if (!v || v.length === 0) return true;
          return v.includes(row.original.status);
        },
        cell: ({ getValue }) => {
          const s = getValue() as ReconciliationStatus;
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
        accessorKey: "expected_value",
        header: () => <span className="text-right block w-full">Esperado</span>,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block w-full">
            {moneyBrl(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: "received_value",
        header: () => <span className="text-right block w-full">Recebido</span>,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-right block w-full">
            {moneyBrl(Number(getValue()))}
          </span>
        ),
      },
      {
        accessorKey: "difference_value",
        header: () => <span className="text-right block w-full">Δ</span>,
        cell: ({ getValue }) => {
          const v = Number(getValue());
          return (
            <span
              className={cn(
                "tabular-nums text-right block w-full font-medium",
                Math.abs(v) < 0.01 ? "text-muted-foreground" : "text-[color:var(--warning)]",
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
    | ReconciliationStatus[]
    | undefined;

  const toggleStatusFilter = (s: ReconciliationStatus) => {
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
    state: { sorting, globalFilter, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => row.original.status !== "finalized",
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

  const itemRows = detailQ.data?.items ?? [];
  const itemsScrollRef = useRef<HTMLDivElement>(null);
  const itemVirtualizer = useVirtualizer({
    count: itemRows.length,
    getScrollElement: () => itemsScrollRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const auditList = detailQ.data?.audit ?? [];
  const auditRef = useRef<HTMLDivElement>(null);
  const auditVirtualizer = useVirtualizer({
    count: auditList.length,
    getScrollElement: () => auditRef.current,
    estimateSize: () => 48,
    overscan: 6,
  });

  const timelineList = detailQ.data?.timeline ?? [];
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineVirtualizer = useVirtualizer({
    count: timelineList.length,
    getScrollElement: () => timelineRef.current,
    estimateSize: () => 52,
    overscan: 6,
  });

  if (!canRead) {
    return (
      <EmptyState
        title="Sem permissão para conciliação operacional"
        description="É necessário acesso de leitura ao fechamento financeiro operacional."
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

  const selected = detailQ.data?.reconciliation;
  const selectedIdsForBulk = table.getFilteredSelectedRowModel().flatRows.map((r) => r.original.id);
  const openIssues = (detailQ.data?.issues ?? []).filter((i) => !i.resolved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conciliação operacional"
        subtitle="Esperado vs recebido, matching por dimensão, divergências e rastreabilidade — base para financeiro futuro."
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
            placeholder="Busca instantânea (competência, status, id)…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
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
            Abrir conciliação
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
          label="Competências (filtro)"
          value={rows.length}
          hint={`${listQ.data?.length ?? 0} no tenant`}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          label="Esperado (painel)"
          value={selected ? moneyBrl(Number(selected.expected_value)) : "—"}
          tone="primary"
          icon={<ArrowRightLeft className="h-4 w-4" />}
        />
        <StatCard
          label="Recebido (painel)"
          value={selected ? moneyBrl(Number(selected.received_value)) : "—"}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pendências abertas"
          value={selected ? String(openIssues) : "—"}
          hint="divergências operacionais"
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      {canWrite && selectedIdsForBulk.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
          <span className="font-medium">{selectedIdsForBulk.length} selecionado(s)</span>
          <button
            type="button"
            disabled={m.bulkRefresh.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            onClick={() =>
              m.bulkRefresh.mutate(selectedIdsForBulk, {
                onSuccess: () => table.resetRowSelection(),
              })
            }
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recalcular totais
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
        <div
          ref={tableScrollRef}
          className="max-h-[min(52vh,560px)] overflow-auto overscroll-contain"
        >
          <div className="min-w-[720px]">
            <div
              className={cn(
                ROW_GRID,
                "sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
              )}
            >
              <span />
              <span>Competência</span>
              <span>Status</span>
              <span className="text-right">Esperado</span>
              <span className="text-right">Recebido</span>
              <span className="text-right">Δ</span>
              <span />
            </div>
            <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map((vRow) => {
                const row = rows[vRow.index];
                if (!row) return null;
                return (
                  <div
                    key={row.id}
                    className={cn(
                      ROW_GRID,
                      "absolute left-0 right-0 px-3 py-2 border-b border-border text-sm hover:bg-muted/40",
                      selectedId === row.original.id && "bg-primary/5",
                    )}
                    style={{ transform: `translateY(${vRow.start}px)` }}
                  >
                    {flexRender(
                      row.getVisibleCells()[0].column.columnDef.cell,
                      row.getVisibleCells()[0].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[1].column.columnDef.cell,
                      row.getVisibleCells()[1].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[2].column.columnDef.cell,
                      row.getVisibleCells()[2].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[3].column.columnDef.cell,
                      row.getVisibleCells()[3].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[4].column.columnDef.cell,
                      row.getVisibleCells()[4].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[5].column.columnDef.cell,
                      row.getVisibleCells()[5].getContext(),
                    )}
                    {flexRender(
                      row.getVisibleCells()[6].column.columnDef.cell,
                      row.getVisibleCells()[6].getContext(),
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-xl border-l border-border bg-card shadow-2xl transition-transform duration-200 flex flex-col",
          selectedId ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!selectedId}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Painel operacional
            </p>
            <p className="text-sm font-medium">
              {selected ? competenceLabel(selected.competence_month) : "—"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-muted"
            onClick={() => setSelectedId(null)}
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {detailQ.isError && (
          <div className="p-4">
            <ErrorState
              message={describeError(detailQ.error).message}
              onRetry={() => void detailQ.refetch()}
            />
          </div>
        )}

        {selected && !detailQ.isError && (
          <>
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border bg-muted/30">
              {(
                [
                  ["summary", "Resumo"],
                  ["items", "Itens"],
                  ["issues", "Divergências"],
                  ["timeline", "Timeline"],
                  ["audit", "Auditoria"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPanelTab(id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium",
                    panelTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {panelTab === "summary" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border p-2">
                      <div className="text-muted-foreground">Esperado</div>
                      <div className="font-semibold tabular-nums">
                        {moneyBrl(Number(selected.expected_value))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-2">
                      <div className="text-muted-foreground">Recebido</div>
                      <div className="font-semibold tabular-nums">
                        {moneyBrl(Number(selected.received_value))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-2 col-span-2">
                      <div className="text-muted-foreground">Diferença (recebido − esperado)</div>
                      <div className="font-semibold tabular-nums text-[color:var(--warning)]">
                        {moneyBrl(Number(selected.difference_value))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Matching operacional
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MATCH_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMatchMode(opt.id)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium",
                            matchMode === opt.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={
                        !canWrite || selected.status === "finalized" || m.runMatching.isPending
                      }
                      onClick={() =>
                        m.runMatching.mutate(
                          { reconciliationId: selected.id, mode: matchMode },
                          {
                            onSuccess: () =>
                              toast.success(
                                "Matching",
                                "Dimensão processada e divergências atualizadas.",
                              ),
                            onError: (e) => toast.error("Matching", describeError(e).message),
                          },
                        )
                      }
                      className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {m.runMatching.isPending ? "Processando…" : "Rodar matching"}
                    </button>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Cada execução substitui linhas de sistema da dimensão escolhida (mantém manual
                      e CSV). Competências com fechamento travado/finalizado não permitem recálculo.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Importação CSV
                    </p>
                    <textarea
                      className="w-full min-h-[120px] rounded-lg border border-border bg-background p-2 text-xs font-mono"
                      value={csvDraft}
                      onChange={(e) => setCsvDraft(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={
                        !canWrite || selected.status === "finalized" || m.applyCsv.isPending
                      }
                      onClick={() =>
                        m.applyCsv.mutate(
                          { reconciliationId: selected.id, csvText: csvDraft },
                          {
                            onSuccess: (r) =>
                              toast.success("Importação", `${r.rowsInserted} linha(s) aplicadas.`),
                            onError: (e) => toast.error("CSV", describeError(e).message),
                          },
                        )
                      }
                      className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                      Aplicar CSV
                    </button>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Conferência manual
                    </p>
                    <input
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                      placeholder="UUID de referência"
                      value={manualRef}
                      onChange={(e) => setManualRef(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        placeholder="Esperado"
                        value={manualExp}
                        onChange={(e) => setManualExp(e.target.value)}
                      />
                      <input
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                        placeholder="Recebido"
                        value={manualRec}
                        onChange={(e) => setManualRec(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={
                        !canWrite ||
                        selected.status === "finalized" ||
                        m.upsertManualItem.isPending ||
                        !manualRef
                      }
                      onClick={() => {
                        void m.upsertManualItem.mutateAsync({
                          reconciliationId: selected.id,
                          referenceId: manualRef,
                          expectedValue: Number(manualExp.replace(",", ".")),
                          receivedValue: Number(manualRec.replace(",", ".")),
                        });
                      }}
                      className="w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                      Gravar linha manual
                    </button>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Vínculo fechamento operacional
                    </p>
                    <select
                      className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
                      value={selected.financial_closing_id ?? ""}
                      disabled={!canWrite || selected.status === "finalized"}
                      onChange={(e) => {
                        const v = e.target.value;
                        void m.linkClosing.mutateAsync({
                          reconciliationId: selected.id,
                          closingId: v ? v : null,
                        });
                      }}
                    >
                      <option value="">— sem vínculo —</option>
                      {(detailQ.data?.closingsSameCompetence ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.status} · {c.id.slice(0, 8)}…
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={!canWrite || selected.status === "finalized" || m.finalize.isPending}
                    onClick={() =>
                      m.finalize.mutate(selected.id, {
                        onSuccess: () => toast.success("Conciliação", "Registro finalizado."),
                      })
                    }
                    className="w-full rounded-lg bg-destructive/90 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                  >
                    Finalizar conciliação
                  </button>
                </div>
              )}

              {panelTab === "items" && (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={itemRows.length === 0 || !selectedId}
                      onClick={() => {
                        downloadCsv(
                          `conciliacao-itens-${selectedId!.slice(0, 8)}`,
                          [
                            "reference_type",
                            "reference_id",
                            "status",
                            "expected_value",
                            "received_value",
                            "difference_value",
                          ],
                          itemRows.map((it) => ({
                            reference_type: it.reference_type,
                            reference_id: it.reference_id ?? "",
                            status: it.status,
                            expected_value: Number(it.expected_value),
                            received_value: Number(it.received_value),
                            difference_value: Number(it.difference_value),
                          })),
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar conciliação (itens CSV)
                    </button>
                  </div>
                  <div
                    ref={itemsScrollRef}
                    className="max-h-[50vh] overflow-auto rounded-lg border border-border"
                  >
                    <div
                      className="relative"
                      style={{ height: `${itemVirtualizer.getTotalSize()}px` }}
                    >
                      {itemVirtualizer.getVirtualItems().map((vr) => {
                        const it = itemRows[vr.index];
                        if (!it) return null;
                        return (
                          <div
                            key={it.id}
                            className="absolute left-0 right-0 px-3 py-2 border-b border-border text-xs grid grid-cols-[1fr_88px_88px_88px] gap-2"
                            style={{ transform: `translateY(${vr.start}px)` }}
                          >
                            <div className="min-w-0">
                              <div className="font-medium truncate">{it.reference_type}</div>
                              <div className="text-muted-foreground truncate font-mono text-[10px]">
                                {it.reference_id ?? "—"}
                              </div>
                            </div>
                            <div className="tabular-nums text-right">
                              {moneyBrl(Number(it.expected_value))}
                            </div>
                            <div className="tabular-nums text-right">
                              {moneyBrl(Number(it.received_value))}
                            </div>
                            <div className="tabular-nums text-right font-medium">
                              {moneyBrl(Number(it.difference_value))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {itemRows.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        Nenhum item ainda. Rode matching ou importe CSV.
                      </p>
                    )}
                  </div>
                </>
              )}

              {panelTab === "issues" && (
                <ul className="space-y-2">
                  {(detailQ.data?.issues ?? []).map((iss) => (
                    <li
                      key={iss.id}
                      className="rounded-lg border border-border p-3 text-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{iss.issue_type}</span>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full",
                            iss.severity === "critical" && "bg-destructive/15 text-destructive",
                            iss.severity === "warning" &&
                              "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
                            iss.severity === "info" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {iss.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {iss.description}
                      </p>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={iss.resolved}
                          disabled={!canWrite || selected.status === "finalized"}
                          onChange={(e) =>
                            m.resolveIssue.mutate({
                              issueId: iss.id,
                              resolved: e.target.checked,
                              reconciliationId: selected.id,
                            })
                          }
                        />
                        Resolvida
                      </label>
                    </li>
                  ))}
                  {(detailQ.data?.issues ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>
                  )}
                </ul>
              )}

              {panelTab === "timeline" && (
                <div
                  ref={timelineRef}
                  className="max-h-[50vh] overflow-auto rounded-lg border border-border"
                >
                  <div
                    className="relative"
                    style={{ height: `${timelineVirtualizer.getTotalSize()}px` }}
                  >
                    {timelineVirtualizer.getVirtualItems().map((vr) => {
                      const ev = timelineList[vr.index];
                      if (!ev) return null;
                      return (
                        <div
                          key={ev.id}
                          className="absolute left-0 right-0 px-3 py-2 border-b border-border text-xs"
                          style={{ transform: `translateY(${vr.start}px)` }}
                        >
                          <div className="font-medium">{ev.event_type}</div>
                          <div className="text-muted-foreground">{ev.description}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {new Date(ev.created_at).toLocaleString("pt-BR")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {timelineList.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">Sem eventos de timeline.</p>
                  )}
                </div>
              )}

              {panelTab === "audit" && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={auditList.length === 0 || !selectedId}
                      onClick={() => {
                        downloadAuditRowsCsv(
                          `auditoria-conciliacao-${selectedId!.slice(0, 8)}`,
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar auditoria (CSV)
                    </button>
                  </div>
                  <div
                    ref={auditRef}
                    className="max-h-[50vh] overflow-auto rounded-lg border border-border"
                  >
                    <div
                      className="relative"
                      style={{ height: `${auditVirtualizer.getTotalSize()}px` }}
                    >
                      {auditVirtualizer.getVirtualItems().map((vr) => {
                        const a = auditList[vr.index];
                        if (!a) return null;
                        return (
                          <div
                            key={a.id}
                            className="absolute left-0 right-0 px-3 py-2 border-b border-border text-xs"
                            style={{ transform: `translateY(${vr.start}px)` }}
                          >
                            <div className="font-medium">{a.action}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(a.created_at).toLocaleString("pt-BR")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {auditList.length === 0 && (
                      <p className="p-4 text-sm text-muted-foreground">
                        Sem registros de auditoria.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {selectedId && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:bg-black/20"
          aria-label="Fechar overlay"
          onClick={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
