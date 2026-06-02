import { createFileRoute, Link } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState, PageHeader, SkeletonRow, StatusBadge } from "@/components/ui-kit";
import {
  operationalMonitoringQueryOptions,
  useExportOperationalBackupMutation,
  useOperationalMonitoringQuery,
} from "@/hooks/use-operational-monitoring";
import { useToast } from "@/hooks/use-toast";
import { can } from "@/lib/auth/rbac";
import { describeError } from "@/lib/queries/result";
import { Download, RefreshCw, Server } from "lucide-react";

export const Route = createFileRoute("/operacao")({
  head: () => ({
    meta: [
      { title: brandPageTitle("Painel operacional") },
      { name: "description", content: "Saúde da plataforma, erros recentes e export de backup." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient
      .prefetchQuery(operationalMonitoringQueryOptions())
      .catch(() => undefined);
  },
  component: OperacaoPage,
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

function OperacaoPage() {
  const { auth } = Route.useRouteContext();
  const role = auth.profile?.role ?? null;
  const allowed = can(role, "tenant_settings:read");
  const q = useOperationalMonitoringQuery();
  const exportB = useExportOperationalBackupMutation();
  const toast = useToast();

  if (!allowed) {
    return (
      <AppShell>
        <EmptyState
          title="Sem acesso"
          description="O painel operacional exige leitura de parametrização institucional."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Painel operacional"
        subtitle="Health checks, erros e métricas recentes — suporte a incidentes e go-live."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/piloto"
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-center"
            >
              Piloto →
            </Link>
            <Link
              to="/ajuda"
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-center"
            >
              Ajuda →
            </Link>
            <Link
              to="/instituicao"
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-center"
            >
              ← Readiness
            </Link>
            <button
              type="button"
              onClick={() => void q.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted/50"
            >
              <RefreshCw className={q.isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
              Atualizar
            </button>
            {can(role, "tenant_settings:write") ? (
              <button
                type="button"
                disabled={exportB.isPending}
                onClick={() => {
                  void (async () => {
                    try {
                      const data = await exportB.mutateAsync();
                      downloadJson(
                        `medicflow-backup-operacional-${new Date().toISOString().slice(0, 10)}.json`,
                        data,
                      );
                      toast.success(
                        "Export concluído",
                        "Arquivo JSON com settings e trilhas recentes foi baixado.",
                      );
                    } catch (e) {
                      toast.error("Falha no export", describeError(e).message);
                    }
                  })();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                Backup operacional
              </button>
            ) : null}
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
        <EmptyState title="Sem dados" description="Não foi possível carregar o painel." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Status e ambiente</h2>
            </div>
            <ul className="space-y-2 text-sm">
              {q.data.health.map((h) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span>{h.label}</span>
                  <StatusBadge status={h.ok ? "confirmado" : "pendente"} />
                </li>
              ))}
            </ul>
            {q.data.publicEnv.warnings.length > 0 ? (
              <p className="text-xs text-[color:var(--warning)]">
                {q.data.publicEnv.warnings.join(" · ")}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-2">
            <h2 className="text-sm font-semibold">Métricas (heartbeat / latência)</h2>
            <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto">
              {q.data.metrics.length === 0 ? (
                <li>Sem métricas ainda — aguarde o intervalo de heartbeat.</li>
              ) : (
                q.data.metrics.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2">
                    <span>{m.metric_name}</span>
                    <span className="tabular-nums">{m.metric_value ?? "—"}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2 space-y-2">
            <h2 className="text-sm font-semibold">Erros recentes</h2>
            <div className="max-h-48 overflow-auto text-xs space-y-2">
              {q.data.errors.length === 0 ? (
                <p className="text-muted-foreground">Nenhum erro registrado neste tenant.</p>
              ) : (
                q.data.errors.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/80 px-2 py-1.5">
                    <div className="font-medium text-foreground">{e.source}</div>
                    <div className="text-muted-foreground">{e.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{e.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2 space-y-2">
            <h2 className="text-sm font-semibold">Logs operacionais</h2>
            <div className="max-h-40 overflow-auto text-xs space-y-2">
              {q.data.logs.length === 0 ? (
                <p className="text-muted-foreground">Sem logs recentes.</p>
              ) : (
                q.data.logs.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-wrap gap-2 justify-between border-b border-border/60 pb-1"
                  >
                    <span className="font-medium">{l.category}</span>
                    <span className="text-muted-foreground text-right flex-1 min-w-[120px]">
                      {l.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
