import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useClientMounted } from "@/hooks/use-client-mounted";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Download,
  FileDown,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatCard } from "@/components/ui-kit";
import type { AuthContext } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { useExecutiveDashboardBundleQuery } from "@/hooks/use-executive-dashboard";
import { describeError } from "@/lib/queries/result";
import { cn } from "@/lib/utils";
import type { ExecutiveCompetenceRollup } from "@/lib/services/executive-dashboard/executive-dashboard-service";
import {
  buildDivergencesReport,
  buildFinancialReport,
  buildGlosasReport,
  buildOperationalReport,
  buildPayoutsReport,
  buildProductionReport,
} from "@/lib/services/reporting/reporting-service";
import {
  dismissHint,
  isHintDismissed,
  onboardingIds,
  readQuickStartStep,
  writeQuickStartStep,
} from "@/lib/services/onboarding/onboarding-service";
import {
  downloadCsv,
  downloadExcelHtmlTable,
  openPrintableOperationalReport,
  reportSectionsToHtmlTable,
} from "@/lib/services/export/export-service";
import { defaultCompetenceMonthUtc } from "@/hooks/use-medical-payout-foundation";

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function competenceLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

type Props = { auth: AuthContext };

export function ExecutiveDashboardView({ auth }: Props) {
  const role = auth.profile?.role ?? null;
  const canRead = can(role, "financial_closing:read");
  const mounted = useClientMounted();

  const [competence, setCompetence] = useState<string | undefined>(undefined);
  const [hintVisible, setHintVisible] = useState(true);
  const [quickStep, setQuickStep] = useState<0 | 1 | 2 | 3>(0);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    setHintVisible(!isHintDismissed(onboardingIds.executiveHints));
    setQuickStep(readQuickStartStep(onboardingIds.executiveQuickStart));
  }, [mounted]);

  const q = useExecutiveDashboardBundleQuery(competence);
  const dash = q.data?.dashboard;
  const notif = q.data?.notifications;

  const rollupColumns = useMemo<ColumnDef<ExecutiveCompetenceRollup>[]>(
    () => [
      {
        accessorKey: "competence_month",
        header: "Competência",
        cell: ({ getValue }) => (
          <span className="font-medium">{competenceLabel(getValue() as string)}</span>
        ),
      },
      {
        id: "closing",
        header: "Fechamento",
        accessorFn: (r) => r.closing?.status ?? "—",
      },
      {
        id: "recon",
        header: "Conciliação",
        accessorFn: (r) => r.reconciliation?.status ?? "—",
      },
      {
        id: "billed",
        header: () => <span className="text-right block w-full">Faturado</span>,
        accessorFn: (r) => (r.closing ? Number(r.closing.total_billed) : null),
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          return (
            <span className="tabular-nums text-right block w-full">
              {v != null ? moneyBrl(v) : "—"}
            </span>
          );
        },
      },
      {
        id: "denied",
        header: () => <span className="text-right block w-full">Glosa</span>,
        accessorFn: (r) => (r.closing ? Number(r.closing.total_denied) : null),
        cell: ({ getValue }) => {
          const v = getValue() as number | null;
          return (
            <span className="tabular-nums text-right block w-full">
              {v != null ? moneyBrl(v) : "—"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: "competence_month", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data: dash?.rollups ?? [],
    columns: rollupColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filter) => {
      const f = String(filter).toLowerCase();
      if (!f) return true;
      const r = row.original;
      const blob = [r.competence_month, r.closing?.status, r.reconciliation?.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(f);
    },
  });

  const prodRows = dash?.kpis.production_by_professional ?? [];

  const maxBilled = useMemo(() => {
    let m = 1;
    for (const r of dash?.rollups ?? []) {
      const v = r.closing ? Number(r.closing.total_billed) : 0;
      if (v > m) m = v;
    }
    return m;
  }, [dash?.rollups]);

  const exportOperationalCsv = () => {
    if (!dash) return;
    const rep = buildOperationalReport(dash, notif ?? null);
    const flat: Record<string, string>[] = [];
    for (const s of rep.sections) {
      for (const row of s.rows) {
        const o: Record<string, string> = { Seção: s.title };
        for (const c of s.columns) {
          o[c] = String(row[c] ?? "");
        }
        flat.push(o);
      }
    }
    if (flat.length === 0) return;
    downloadCsv(
      `relatorio-operacional-${dash.competence_focus.slice(0, 7)}`,
      Object.keys(flat[0]),
      flat,
    );
  };

  const exportExcelSummary = () => {
    if (!dash) return;
    const rep = buildFinancialReport(dash);
    const html = reportSectionsToHtmlTable(rep.sections);
    downloadExcelHtmlTable(`financeiro-${dash.competence_focus.slice(0, 7)}`, "Resumo", html);
  };

  const printPdf = (kind: "operacional" | "glosas" | "producao" | "repasses" | "divergencias") => {
    if (!dash) return;
    const map = {
      operacional: buildOperationalReport(dash, notif ?? null),
      glosas: buildGlosasReport(dash),
      producao: buildProductionReport(dash),
      repasses: buildPayoutsReport(dash),
      divergencias: buildDivergencesReport(dash),
    } as const;
    const payload = map[kind];
    openPrintableOperationalReport(
      `Relatório ${kind} · ${competenceLabel(dash.competence_focus)}`,
      payload.sections,
    );
  };

  if (!canRead) {
    return (
      <EmptyState
        title="Sem permissão para visão executiva"
        description="Peça acesso de leitura ao fechamento financeiro operacional ao administrador do tenant."
      />
    );
  }

  if (q.isError) {
    return <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard executivo"
        subtitle="Faturamento, glosas, repasses, conciliação e fechamento — agregação leve para auditoria e demo."
        actions={
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              disabled={q.isFetching}
              onClick={() => void q.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/60 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", q.isFetching && "animate-spin")} />
              Atualizar
            </button>
            <Link
              to="/financeiro"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted/60"
            >
              Financeiro
            </Link>
          </div>
        }
      />

      {hintVisible && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 flex gap-3 items-start">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-foreground">Dicas rápidas</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Use a competência foco para alinhar cartões ao mês analisado. Exportações são geradas
              no navegador (sem bloquear o servidor). Para PDF, use Imprimir → &quot;Salvar como
              PDF&quot;.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 p-1 rounded-md hover:bg-primary/10 text-muted-foreground"
            aria-label="Dispensar"
            onClick={() => {
              dismissHint(onboardingIds.executiveHints);
              setHintVisible(false);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 ring-soft">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Quick start guiado</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {(
            [
              {
                step: 1 as const,
                label: "1. Consolidar",
                to: "/financeiro/fechamento-operacional",
              },
              {
                step: 2 as const,
                label: "2. Conciliar",
                to: "/financeiro/conciliacao-operacional",
              },
              { step: 3 as const, label: "3. TISS / repasses", to: "/tiss" },
            ] as const
          ).map((s) => (
            <Link
              key={s.step}
              to={s.to}
              onClick={() => {
                const next = s.step as 0 | 1 | 2 | 3;
                writeQuickStartStep(onboardingIds.executiveQuickStart, next);
                setQuickStep(next);
              }}
              className={cn(
                "rounded-lg border px-3 py-2 font-medium transition-colors flex items-center justify-between gap-2",
                quickStep >= s.step
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
              )}
            >
              {s.label}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Competência foco
          </label>
          <input
            type="month"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            value={(competence ?? dash?.competence_focus ?? defaultCompetenceMonthUtc()).slice(
              0,
              7,
            )}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setCompetence(undefined);
                return;
              }
              setCompetence(`${v}-01`);
            }}
          />
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground underline"
            onClick={() => setCompetence(undefined)}
          >
            Auto (último cadastro)
          </button>
        </div>
        <div className="flex-1 min-w-0 relative max-w-md">
          <input
            type="search"
            placeholder="Busca na grade de competências…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm ring-soft focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Quick actions
        </span>
        <Link
          to="/tiss"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
        >
          Criar guia
        </Link>
        <Link
          to="/tiss"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
        >
          Gerar lote
        </Link>
        <Link
          to="/financeiro/fechamento-operacional"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
        >
          Fechar competência
        </Link>
        <Link
          to="/tiss"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
        >
          Recalcular repasse
        </Link>
        <Link
          to="/financeiro/conciliacao-operacional"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
        >
          Iniciar conciliação
        </Link>
        <div className="relative">
          <button
            type="button"
            aria-expanded={exportMenuOpen}
            aria-haspopup="true"
            onClick={() => setExportMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <FileDown className="h-3.5 w-3.5" />
            Exportar relatório
          </button>
          {exportMenuOpen ? (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[220px] rounded-lg border border-border bg-card shadow-lg py-1 text-xs">
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center gap-2"
                onClick={() => {
                  setExportMenuOpen(false);
                  exportOperationalCsv();
                }}
              >
                <Download className="h-3.5 w-3.5" /> CSV operacional
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center gap-2"
                onClick={() => {
                  setExportMenuOpen(false);
                  exportExcelSummary();
                }}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel (.xls) financeiro
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center gap-2"
                onClick={() => {
                  setExportMenuOpen(false);
                  printPdf("operacional");
                }}
              >
                <Printer className="h-3.5 w-3.5" /> PDF / impressão operacional
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60"
                onClick={() => {
                  setExportMenuOpen(false);
                  printPdf("glosas");
                }}
              >
                Relatório de glosas
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60"
                onClick={() => {
                  setExportMenuOpen(false);
                  printPdf("producao");
                }}
              >
                Relatório de produção
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60"
                onClick={() => {
                  setExportMenuOpen(false);
                  printPdf("repasses");
                }}
              >
                Relatório de repasses
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/60"
                onClick={() => {
                  setExportMenuOpen(false);
                  printPdf("divergencias");
                }}
              >
                Relatório de divergências
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {notif && notif.items.length > 0 && (
        <div className="rounded-xl border border-border bg-card ring-soft overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Bell className="h-4 w-4 text-[color:var(--warning)]" />
            <h2 className="text-sm font-semibold">Notificações operacionais</h2>
          </div>
          <ul className="divide-y divide-border max-h-48 overflow-y-auto">
            {notif.items.map((n) => (
              <li
                key={n.id}
                className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      n.severity === "critical" && "text-destructive",
                      n.severity === "warning" && "text-[color:var(--warning)]",
                      n.severity === "info" && "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                </div>
                <Link
                  to={n.href}
                  className="text-xs font-medium text-primary whitespace-nowrap shrink-0"
                >
                  Abrir →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {q.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} height={96} />
          ))}
        </div>
      )}

      {dash && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              label="Faturamento consolidado"
              value={moneyBrl(dash.consolidated_billing)}
              hint={competenceLabel(dash.competence_focus)}
              tone="primary"
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Glosas (valor)"
              value={moneyBrl(dash.glosas_value)}
              hint={
                dash.kpis.glosa_percent != null ? `${dash.kpis.glosa_percent}% do faturado` : "—"
              }
              tone="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatCard
              label="Perdas operacionais (est.)"
              value={moneyBrl(dash.operational_loss_estimate)}
              hint="Glosa + diferença operacional positiva"
              tone="warning"
            />
            <StatCard
              label="Produção médica aprovada"
              value={moneyBrl(dash.medical_production_approved)}
              hint="Competência foco"
              tone="success"
            />
            <StatCard
              label="Repasses"
              value={moneyBrl(dash.transfers_payouts)}
              hint={`Líquido prof.: ${moneyBrl(dash.kpis.net_payout_total)}`}
            />
            <StatCard
              label="Divergências |Δ|"
              value={moneyBrl(dash.financial_divergence_abs)}
              hint={`Sinais abertos: ${dash.kpis.open_divergence_signals}`}
            />
            <StatCard
              label="Tempo médio fechamento"
              value={dash.kpis.mean_closing_days != null ? `${dash.kpis.mean_closing_days} d` : "—"}
              hint="Locked/finalized"
            />
            <StatCard
              label="Total conciliado"
              value={moneyBrl(dash.kpis.total_reconciled_received)}
              hint="Recebido em conciliações finalizadas"
              tone="success"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 ring-soft">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Faturamento por competência
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(dash.rollups ?? [])
                  .filter((r) => r.closing && r.closing.total_billed > 0)
                  .slice(0, 12)
                  .map((r) => {
                    const v = r.closing ? Number(r.closing.total_billed) : 0;
                    const w = Math.round((v / maxBilled) * 100);
                    return (
                      <div key={r.competence_month} className="text-xs">
                        <div className="flex justify-between gap-2 mb-0.5">
                          <span className="text-muted-foreground truncate">
                            {competenceLabel(r.competence_month)}
                          </span>
                          <span className="tabular-nums font-medium shrink-0">{moneyBrl(v)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/80"
                            style={{ width: `${w}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {dash.rollups.filter((r) => r.closing && r.closing.total_billed > 0).length ===
                  0 && (
                  <p className="text-xs text-muted-foreground">
                    Sem fechamentos com faturamento ainda.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 ring-soft">
              <h3 className="text-sm font-semibold mb-3">Competência fechada vs aberta</h3>
              <div className="flex gap-4 items-end">
                <div>
                  <div className="text-2xl font-semibold text-[color:var(--success)]">
                    {dash.kpis.closed_closings}
                  </div>
                  <div className="text-xs text-muted-foreground">Fechadas (locked/final)</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-muted-foreground">
                    {dash.kpis.open_closings}
                  </div>
                  <div className="text-xs text-muted-foreground">Em aberto</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                Indicadores usam amostra dos últimos cadastros de fechamento e conciliação —
                adequado para demo e operação inicial sem scans analíticos pesados.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden ring-soft">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Grade operacional</h3>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Cabeçalhos fixos na rolagem
              </span>
            </div>
            <div className="overflow-x-auto max-h-[min(420px,50vh)] overflow-y-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm border-b border-border">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-3 py-2"
                        >
                          {h.isPlaceholder
                            ? null
                            : flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.getRowModel().rows.length === 0 && (
                <div className="p-6">
                  <EmptyState
                    title="Nenhuma competência na grade"
                    description="Cadastre fechamentos ou conciliações para ver o consolidado."
                    action={
                      <Link
                        to="/financeiro/fechamento-operacional"
                        className="text-sm font-medium text-primary"
                      >
                        Ir para fechamento
                      </Link>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden ring-soft">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Produção por profissional</h3>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Profissional</th>
                    <th className="text-right px-3 py-2 font-medium">Guias</th>
                    <th className="text-right px-3 py-2 font-medium">Aprovado</th>
                    <th className="text-right px-3 py-2 font-medium">Repasse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prodRows.map((p) => (
                    <tr key={p.professional_id} className="hover:bg-muted/40">
                      <td className="px-3 py-2 truncate max-w-[200px]">{p.display_name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.guide_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {moneyBrl(p.total_approved)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {moneyBrl(p.payout_final_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {prodRows.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">
                  {dash.bundle_present
                    ? "Sem produção registrada para esta competência."
                    : "Sem bundle operacional para a competência foco — ajuste o mês ou cadastre TISS/produção."}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
