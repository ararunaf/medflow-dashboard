import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { DeploymentChecklistPanel } from "@/components/pilot-launch/deployment-checklist-panel";
import { GuidedDemoPanel } from "@/components/pilot-launch/guided-demo-panel";
import { OnboardingWizardPanel } from "@/components/pilot-launch/onboarding-wizard-panel";
import { PilotLaunchStatusCard } from "@/components/pilot-launch/pilot-launch-status-card";
import { PilotExecutionPanel } from "@/components/pilot-launch/pilot-execution-panel";
import { PilotSupportPanel } from "@/components/pilot-launch/pilot-support-panel";
import { EmptyState, ErrorState, PageHeader, SkeletonRow } from "@/components/ui-kit";
import {
  operationalReadinessQueryOptions,
  useOperationalReadinessQuery,
} from "@/hooks/use-commercial-readiness";
import {
  pilotExecutionQueryOptions,
  usePilotExecutionQuery,
  useRecordPilotAdoptionMutation,
} from "@/hooks/use-pilot-execution";
import { can } from "@/lib/auth/rbac";
import { describeError } from "@/lib/queries/result";
import { buildOnboardingProgress } from "@/lib/services/onboarding-progress";
import { validateTenantForPilot } from "@/lib/services/onboarding-wizard/tenant-validation";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { usePilotManualFlags } from "@/hooks/use-pilot-manual-flags";
import {
  buildPilotDeploymentChecklist,
  readPilotManualFlag,
  type PilotManualKey,
  writePilotManualFlag,
} from "@/lib/services/deployment-checklist/deployment-checklist-service";
import {
  buildPilotDiagnosticExport,
  buildPilotOperationalStatus,
} from "@/lib/services/pilot-support";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/piloto")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Piloto e implantação") },
      {
        name: "description",
        content: "Onboarding assistido, checklist de implantação e demo guiada.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(operationalReadinessQueryOptions()).catch(() => undefined),
      context.queryClient.prefetchQuery(pilotExecutionQueryOptions(0)).catch(() => undefined),
    ]);
  },
  component: PilotoPage,
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

function PilotoPage() {
  const { auth } = Route.useRouteContext();
  const mounted = useClientMounted();
  const role = auth.profile?.role ?? null;
  const tenantId = auth.tenantId ?? undefined;
  const allowed = can(role, "tenant_settings:read");
  const q = useOperationalReadinessQuery();
  const [manualTick, setManualTick] = useState(0);
  const recordAdoption = useRecordPilotAdoptionMutation();
  const onboardingRecorded = useRef(false);

  const manualChecklistState = usePilotManualFlags(tenantId, manualTick);

  const pilotChecklist = useMemo(() => {
    if (!q.data) return [];
    return buildPilotDeploymentChecklist({
      settings: q.data.settings,
      health: q.data.health,
      operationalChecklist: q.data.checklist,
      snapshot: q.data.pilotSnapshot,
      manual: manualChecklistState,
    });
  }, [manualChecklistState, q.data]);

  const operationalChecklist = useMemo(() => q.data?.checklist ?? [], [q.data?.checklist]);

  const pilotProgress = useMemo(() => {
    if (pilotChecklist.length === 0) return 0;
    const done = pilotChecklist.filter((i) => i.done).length;
    return Math.round((done / pilotChecklist.length) * 100);
  }, [pilotChecklist]);

  const operationalProgress = useMemo(() => {
    if (operationalChecklist.length === 0) return 0;
    const done = operationalChecklist.filter((i) => i.done).length;
    return Math.round((done / operationalChecklist.length) * 100);
  }, [operationalChecklist]);

  const onboardingProgress = useMemo(
    () =>
      buildOnboardingProgress(
        {
          deploymentDone: pilotChecklist.filter((i) => i.done).length,
          deploymentTotal: pilotChecklist.length,
          operationalDone: operationalChecklist.filter((i) => i.done).length,
          operationalTotal: operationalChecklist.length,
        },
        { readClientStorage: mounted },
      ),
    [pilotChecklist, operationalChecklist, mounted],
  );

  const pilotQWithProgress = usePilotExecutionQuery(onboardingProgress.overallPercent);

  useEffect(() => {
    if (!onboardingProgress.pilotReady || onboardingRecorded.current) return;
    onboardingRecorded.current = true;
    void recordAdoption
      .mutateAsync({ eventType: "onboarding_complete", module: "piloto" })
      .catch(() => undefined);
  }, [onboardingProgress.pilotReady, recordAdoption]);

  const tenantValidation = useMemo(() => {
    if (!q.data) return { ok: false, issues: [] };
    return validateTenantForPilot({
      settings: q.data.settings,
      health: q.data.health,
      snapshot: q.data.pilotSnapshot,
    });
  }, [q.data]);

  const operationalStatus = useMemo(() => {
    if (!q.data) return [];
    const dbOk = q.data.health.find((h) => h.id === "database")?.ok ?? false;
    return buildPilotOperationalStatus({
      dbOk,
      deploymentPercent: pilotProgress,
      envWarningCount: q.data.publicEnv.warnings.length,
      contactConfigured: !!(
        q.data.settings?.contact_email?.trim() || q.data.settings?.support_phone?.trim()
      ),
    });
  }, [q.data, pilotProgress]);

  const snapshotFooter = q.data
    ? `Papéis ativos: ${q.data.pilotSnapshot.distinctRoles.join(", ") || "—"} · Perfis: ${q.data.pilotSnapshot.profileCount} · Convênios: ${q.data.pilotSnapshot.insuranceProviderCount}${
        q.data.pilotSnapshot.openOrActiveClosingCount === null
          ? " · Competências: validar com papel financeiro"
          : ` · Fechamentos não finalizados: ${q.data.pilotSnapshot.openOrActiveClosingCount}`
      }`
    : undefined;

  function toggleManual(key: PilotManualKey) {
    const cur = readPilotManualFlag(tenantId, key);
    writePilotManualFlag(tenantId, key, !cur);
    setManualTick((n) => n + 1);
  }

  if (!allowed) {
    return (
      <AppShell>
        <EmptyState
          title="Acesso à implantação piloto"
          description="É necessário leitura de parametrização institucional. Solicite ao administrador do tenant."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Piloto e implantação"
        subtitle="Wizard rápido, checklist comercial, demo guiada e suporte operacional inicial."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <Link to="/ajuda" className="text-xs font-medium text-primary hover:underline">
              Central de ajuda →
            </Link>
            <button
              type="button"
              onClick={() => void q.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted/50"
            >
              <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar
            </button>
          </div>
        }
      />

      {q.isLoading ? (
        <div className="space-y-3">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : q.isError ? (
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      ) : !q.data ? (
        <EmptyState
          title="Sem dados"
          description="Não foi possível carregar readiness do tenant."
        />
      ) : (
        <div className="space-y-6">
          <PilotLaunchStatusCard progress={onboardingProgress} validation={tenantValidation} />
          <OnboardingWizardPanel />
          <DeploymentChecklistPanel
            title="Checklist de implantação piloto"
            items={pilotChecklist}
            progressPercent={pilotProgress}
            footer={snapshotFooter}
            tenantId={tenantId}
            onToggleManual={toggleManual}
          />
          <DeploymentChecklistPanel
            title="Checklist operacional"
            items={operationalChecklist}
            progressPercent={operationalProgress}
            footer="Itens derivados de parametrização institucional e health checks."
          />
          <GuidedDemoPanel />
          {pilotQWithProgress.data ? (
            <PilotExecutionPanel
              data={pilotQWithProgress.data}
              role={role}
              onboardingPercent={onboardingProgress.overallPercent}
            />
          ) : pilotQWithProgress.isLoading ? (
            <SkeletonRow height={120} />
          ) : null}
          <PilotSupportPanel
            contactEmail={q.data.settings?.contact_email}
            supportPhone={q.data.settings?.support_phone}
            operationalStatus={operationalStatus}
            onExportDiagnostic={() => {
              const payload = buildPilotDiagnosticExport({
                tenantId: tenantId ?? null,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
                checklistSummary: pilotChecklist.map((i) => ({
                  id: i.id,
                  done: i.done,
                  title: i.title,
                })),
                healthSummary: q.data!.health.map((h) => ({ id: h.id, ok: h.ok, label: h.label })),
                publicEnvWarnings: q.data!.publicEnv.warnings,
              });
              downloadJson(
                `medicflow-diagnostico-piloto-${new Date().toISOString().slice(0, 10)}.json`,
                payload,
              );
            }}
          />
        </div>
      )}
    </AppShell>
  );
}
