import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { ReleaseChecklistSection } from "@/components/production-release/release-checklist-section";
import { OperationalReadinessIndicator } from "@/components/operational-readiness-indicator";
import { ProductionLoadingShell } from "@/components/production-release/production-loading-shell";
import { SmokeTestPanel } from "@/components/production-release/smoke-test-panel";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import {
  operationalReadinessQueryOptions,
  useOperationalReadinessQuery,
} from "@/hooks/use-commercial-readiness";
import {
  productionReleaseQueryOptions,
  useExportBackupMutation,
  useProductionReleaseQuery,
  useRunSmokeTestsMutation,
} from "@/hooks/use-production-release";
import { can } from "@/lib/auth/rbac";
import { describeError } from "@/lib/queries/result";
import { buildOnboardingProgress } from "@/lib/services/onboarding-progress";
import { buildReleaseChecklistBundle } from "@/lib/services/release-checklist/release-checklist-service";
import type { BackupExportKind } from "@/lib/services/backup-readiness/backup-readiness-service";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { usePilotManualFlags } from "@/hooks/use-pilot-manual-flags";
import { buildPilotDeploymentChecklist } from "@/lib/services/deployment-checklist/deployment-checklist-service";
import { Download, RefreshCw, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/lancamento")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Lançamento e go-live") },
      {
        name: "description",
        content: "Checklists de produção, smoke tests e backup para lançamento comercial.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(productionReleaseQueryOptions()).catch(() => undefined),
      context.queryClient.prefetchQuery(operationalReadinessQueryOptions()).catch(() => undefined),
    ]);
  },
  component: LancamentoPage,
});

function downloadJson(filename: string, payload: unknown) {
  const body = JSON.stringify(payload, null, 2);
  const blob = new Blob([body], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function checklistPercent(items: { done: boolean }[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

function LancamentoPage() {
  const { auth } = Route.useRouteContext();
  const mounted = useClientMounted();
  const role = auth.profile?.role ?? null;
  const tenantId = auth.tenantId ?? undefined;
  const allowed = can(role, "tenant_settings:read");
  const canWrite = can(role, "tenant_settings:write");

  const q = useProductionReleaseQuery();
  const ops = useOperationalReadinessQuery();
  const smoke = useRunSmokeTestsMutation();
  const exportBackup = useExportBackupMutation();
  const toast = useToast();
  const [smokeReport, setSmokeReport] = useState<Awaited<
    ReturnType<typeof smoke.mutateAsync>
  > | null>(null);

  const manualFlags = usePilotManualFlags(tenantId);

  const deploymentPercent = useMemo(() => {
    if (!ops.data) return 0;
    const items = buildPilotDeploymentChecklist({
      settings: ops.data.settings,
      health: ops.data.health,
      operationalChecklist: ops.data.checklist,
      snapshot: ops.data.pilotSnapshot,
      manual: manualFlags,
    });
    return checklistPercent(items);
  }, [ops.data, manualFlags]);

  const onboardingProgress = useMemo(() => {
    if (!ops.data) return null;
    const deploymentDone = Math.round((deploymentPercent / 100) * 10);
    return buildOnboardingProgress(
      {
        deploymentDone,
        deploymentTotal: 10,
        operationalDone: ops.data.checklist.filter((c) => c.done).length,
        operationalTotal: ops.data.checklist.length || 4,
      },
      { readClientStorage: mounted },
    );
  }, [ops.data, deploymentPercent, mounted]);

  const releaseBundle = useMemo(() => {
    if (!q.data?.productionValidation) return null;
    const operationalDone = ops.data?.checklist.filter((c) => c.done).length ?? 0;
    const operationalTotal = ops.data?.checklist.length ?? 4;
    return buildReleaseChecklistBundle({
      productionReport: q.data.productionValidation,
      operationalDone,
      operationalTotal,
      deploymentPercent,
      wizardPercent: onboardingProgress?.wizardPercent ?? 0,
      smokeAllPassed: smokeReport?.allPassed ?? false,
    });
  }, [q.data, ops.data, deploymentPercent, onboardingProgress, smokeReport]);

  if (!allowed) {
    return (
      <AppShell>
        <EmptyState
          title="Acesso restrito"
          description="Requer permissão de leitura institucional."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Lançamento e go-live"
        subtitle="Produção, smoke tests, backup e checklists finais para clientes piloto."
        actions={
          <MotionHeaderActions
            onRefresh={() => {
              void q.refetch();
              void ops.refetch();
            }}
            refreshing={q.isFetching}
          />
        }
      />

      {q.isLoading ? <ProductionLoadingShell rows={4} /> : null}
      {q.isError ? (
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      ) : null}

      {q.data && releaseBundle ? (
        <div className="space-y-6 max-w-4xl">
          <section className="rounded-xl border border-border bg-card ring-soft p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-primary" />
                Validação de produção
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Score {q.data.productionValidation.scorePercent}% ·{" "}
                {q.data.productionValidation.ok ? "Críticos OK" : "Pendências críticas"}
                {q.data.releaseReadiness ? (
                  <> · Release {q.data.releaseReadiness.scorePercent}%</>
                ) : null}
              </p>
            </div>
            <OperationalReadinessIndicator
              scorePercent={q.data.productionValidation.scorePercent}
              ready={q.data.releaseReadiness?.ready ?? q.data.productionValidation.ok}
            />
            <StatusBadge status={q.data.productionValidation.ok ? "confirmado" : "pendente"} />
          </section>

          <SmokeTestPanel
            report={smokeReport}
            running={smoke.isPending}
            onRun={() => {
              void smoke
                .mutateAsync()
                .then((report) => {
                  setSmokeReport(report);
                  toast.success(
                    report.allPassed ? "Smoke tests OK" : "Smoke tests com falhas",
                    report.results.map((r) => r.label).join(" · "),
                  );
                })
                .catch((err) => toast.error("Smoke tests", describeError(err).message));
            }}
          />

          <ReleaseChecklistSection
            title="Go-live"
            items={releaseBundle.goLive}
            progressPercent={checklistPercent(releaseBundle.goLive)}
          />
          <ReleaseChecklistSection
            title="Release"
            items={releaseBundle.release}
            progressPercent={checklistPercent(releaseBundle.release)}
          />
          <ReleaseChecklistSection
            title="Onboarding tenant"
            items={releaseBundle.tenantOnboarding}
            progressPercent={checklistPercent(releaseBundle.tenantOnboarding)}
          />

          <section className="rounded-xl border border-border bg-card ring-soft p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Backup readiness
            </h2>
            <ul className="space-y-2 mb-4">
              {q.data.backupChecklist.map((item) => (
                <li
                  key={item.id}
                  className="text-xs text-muted-foreground flex justify-between gap-2"
                >
                  <span>{item.title}</span>
                  <StatusBadge status={item.done ? "confirmado" : "pendente"} />
                </li>
              ))}
            </ul>
            {canWrite ? (
              <div className="flex flex-wrap gap-2">
                {(["tenant", "financial", "audit", "operational"] as BackupExportKind[]).map(
                  (kind) => (
                    <button
                      key={kind}
                      type="button"
                      disabled={exportBackup.isPending}
                      className="text-xs rounded-md border border-input px-3 py-1.5 hover:bg-accent"
                      onClick={() => {
                        void exportBackup
                          .mutateAsync(kind)
                          .then((payload) => {
                            downloadJson(
                              `medicflow-backup-${kind}-${new Date().toISOString().slice(0, 10)}.json`,
                              payload,
                            );
                            toast.success("Export concluído", kind);
                          })
                          .catch((err) => toast.error("Export", describeError(err).message));
                      }}
                    >
                      Export {kind}
                    </button>
                  ),
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Export requer tenant_settings:write.</p>
            )}
          </section>

          <p className="text-xs text-muted-foreground flex flex-wrap gap-3">
            <Link to="/piloto" className="text-primary hover:underline">
              Piloto →
            </Link>
            <Link to="/instituicao" className="text-primary hover:underline">
              Instituição →
            </Link>
            <Link to="/site" className="text-primary hover:underline" target="_blank">
              Landing pública →
            </Link>
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}

function MotionHeaderActions({
  onRefresh,
  refreshing,
}: {
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      Atualizar
    </button>
  );
}
