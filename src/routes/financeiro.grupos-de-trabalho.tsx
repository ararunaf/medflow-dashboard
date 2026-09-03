import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Download, Printer, Users } from "lucide-react";
import { assertFinancialReadAccess } from "@/lib/routes/finance-access";
import { can } from "@/lib/auth/rbac";
import { useWorkGroupProductionQuery } from "@/hooks/use-executive-dashboard";
import {
  useProfessionalWorkGroupAssignmentsQuery,
  useWorkGroupsQuery,
} from "@/hooks/use-operations";
import { useCreateWorkGroup, useSetProfessionalWorkGroup } from "@/hooks/use-operational-mutations";
import { defaultCompetenceMonthUtc } from "@/hooks/use-medical-payout-foundation";
import { buildWorkGroupProductionReport } from "@/lib/services/reporting/reporting-service";
import { downloadCsv, openPrintableOperationalReport } from "@/lib/services/export/export-service";
import { describeError } from "@/lib/queries/result";
import { toast } from "@/lib/toast/bus";

export const Route = createFileRoute("/financeiro/grupos-de-trabalho")({
  beforeLoad: ({ context }) => {
    assertFinancialReadAccess(context.auth);
  },
  head: () => ({
    meta: [
      { title: brandPageTitle("Grupos de trabalho") },
      {
        name: "description",
        content: "Produção e repasse agregados por grupo de trabalho, por competência.",
      },
    ],
  }),
  component: GruposDeTrabalhoPage,
});

function competenceLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

function money(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function GruposDeTrabalhoPage() {
  const { auth } = Route.useRouteContext();
  const role = auth.profile?.role ?? null;
  const canManage = can(role, "work_groups:manage");
  const [competence, setCompetence] = useState<string>(defaultCompetenceMonthUtc());

  const report = useWorkGroupProductionQuery(competence);
  const onError = (err: unknown) => toast.error("Erro operacional", describeError(err).message);

  const exportCsv = () => {
    if (!report.data || report.data.length === 0) return;
    const payload = buildWorkGroupProductionReport(report.data, competence, new Date().toISOString());
    const rows = payload.sections[0]!.rows;
    downloadCsv(`producao-grupos-trabalho-${competence.slice(0, 7)}`, payload.sections[0]!.columns, rows);
  };

  const printReport = () => {
    if (!report.data) return;
    const payload = buildWorkGroupProductionReport(report.data, competence, new Date().toISOString());
    openPrintableOperationalReport(
      `Produção por grupo de trabalho · ${competenceLabel(competence)}`,
      payload.sections,
    );
  };

  return (
    <AppShell>
      <PageHeader title="Grupos de trabalho" subtitle="Produção e repasse por grupo" />

      <div className="flex flex-col lg:flex-row gap-3 lg:items-end mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Competência
          </label>
          <input
            type="month"
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            value={competence.slice(0, 7)}
            onChange={(e) => {
              if (!e.target.value) return;
              setCompetence(`${e.target.value}-01`);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={!report.data?.length}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={printReport} disabled={!report.data?.length}>
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </div>

      <ProductionByGroupTable competence={competence} report={report} />

      {canManage ? <ManageWorkGroupsSection onError={onError} /> : null}
    </AppShell>
  );
}

function ProductionByGroupTable({
  competence,
  report,
}: {
  competence: string;
  report: ReturnType<typeof useWorkGroupProductionQuery>;
}) {
  if (report.isLoading) {
    return (
      <div className="space-y-3 mb-6">
        <SkeletonRow height={48} />
        <SkeletonRow height={48} />
      </div>
    );
  }
  if (report.isError) {
    return (
      <div className="mb-6">
        <ErrorState message={describeError(report.error).message} onRetry={() => report.refetch()} />
      </div>
    );
  }
  const rows = report.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="mb-6">
        <EmptyState
          title="Sem produção nesta competência"
          description={`Nenhuma guia aprovada encontrada para ${competenceLabel(competence)}.`}
        />
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-card border border-border ring-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-5 py-3">Grupo de trabalho</th>
              <th className="text-right font-medium px-5 py-3">Profissionais</th>
              <th className="text-right font-medium px-5 py-3">Guias</th>
              <th className="text-right font-medium px-5 py-3">Aprovado</th>
              <th className="text-right font-medium px-5 py-3">Repasse líquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.workGroupId ?? "sem-grupo"}>
                <td className="px-5 py-3 text-foreground">{r.workGroupName}</td>
                <td className="px-5 py-3 text-right">{r.professionalCount}</td>
                <td className="px-5 py-3 text-right">{r.guideCount}</td>
                <td className="px-5 py-3 text-right font-medium">{money(r.totalApproved)}</td>
                <td className="px-5 py-3 text-right">{money(r.payoutFinalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageWorkGroupsSection({ onError }: { onError: (err: unknown) => void }) {
  const groups = useWorkGroupsQuery();
  const assignments = useProfessionalWorkGroupAssignmentsQuery();
  const createGroup = useCreateWorkGroup({ onError });
  const setGroup = useSetProfessionalWorkGroup({ onError });
  const [newGroupName, setNewGroupName] = useState("");

  return (
    <section className="rounded-xl bg-card border border-border ring-soft p-4">
      <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
        <Users className="h-4 w-4" /> Administrar grupos
      </h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nome do novo grupo"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <Button
          size="sm"
          disabled={!newGroupName.trim() || createGroup.isPending}
          onClick={() => {
            createGroup.mutate({ name: newGroupName }, { onSuccess: () => setNewGroupName("") });
          }}
        >
          {createGroup.isPending ? "Criando…" : "Criar grupo"}
        </Button>
      </div>

      {groups.isLoading || assignments.isLoading ? (
        <SkeletonRow height={120} />
      ) : groups.isError ? (
        <ErrorState message={describeError(groups.error).message} onRetry={() => groups.refetch()} />
      ) : assignments.isError ? (
        <ErrorState
          message={describeError(assignments.error).message}
          onRetry={() => assignments.refetch()}
        />
      ) : (assignments.data ?? []).length === 0 ? (
        <EmptyState
          title="Nenhum profissional cadastrado"
          description="Profissionais aparecem aqui assim que houver cooperados no tenant."
        />
      ) : (
        <div className="space-y-2">
          {(assignments.data ?? []).map((a) => (
            <div
              key={a.professionalId}
              className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-3"
            >
              <span className="text-sm">{a.professionalName}</span>
              <select
                className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                value={a.workGroupId ?? ""}
                disabled={setGroup.isPending}
                onChange={(e) =>
                  setGroup.mutate({
                    professionalId: a.professionalId,
                    workGroupId: e.target.value || null,
                  })
                }
              >
                <option value="">Sem grupo</option>
                {(groups.data ?? []).map((g) => (
                  <option key={g.workGroupId} value={g.workGroupId}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
