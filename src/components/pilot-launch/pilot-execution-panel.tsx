import { Activity, BarChart3, Download, Flag, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/ui-kit";
import {
  useEnsurePilotFlagsMutation,
  useExportPilotIncidentsMutation,
  useSetPilotFeatureFlagMutation,
  useUpdatePilotIncidentMutation,
} from "@/hooks/use-pilot-execution";
import { can } from "@/lib/auth/rbac";
import type { UserRole } from "@/lib/database.types";
import type { PilotExecutionBundle } from "@/lib/pilot-execution/api/pilot-execution-server";
import {
  countOpenIncidents,
  type PilotFollowUpStatus,
  type PilotIncidentStatus,
} from "@/lib/services/pilot-execution";

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  investigating: "Em análise",
  resolved: "Resolvido",
  closed: "Encerrado",
};

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

export function PilotExecutionPanel({
  data,
  role,
  onboardingPercent,
}: {
  data: PilotExecutionBundle;
  role: UserRole | null;
  onboardingPercent: number;
}) {
  const canAdmin = can(role, "tenant_settings:write");
  const updateIncident = useUpdatePilotIncidentMutation(onboardingPercent);
  const setFlag = useSetPilotFeatureFlagMutation(onboardingPercent);
  const ensureFlags = useEnsurePilotFlagsMutation(onboardingPercent);
  const exportIncidents = useExportPilotIncidentsMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const { open, critical } = countOpenIncidents(data.incidents);
  const { adoption, analytics } = data;

  async function saveIncident(
    incidentId: string,
    patch: {
      incidentStatus?: PilotIncidentStatus;
      followUpStatus?: PilotFollowUpStatus;
      resolutionNotes?: string | null;
    },
  ) {
    await updateIncident.mutateAsync({ incidentId, ...patch });
    setEditingId(null);
    setResolutionNotes("");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card ring-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Status do piloto</h2>
          </div>
          {open > 0 ? (
            <span className="inline-flex rounded-full bg-[color:var(--warning)]/15 px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--warning)]">
              {open} incidente(s) aberto(s)
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-[color:var(--success)]/15 px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--success)]">
              Sem incidentes abertos
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Adoção operacional"
            value={`${adoption.score}%`}
            hint={adoption.label}
            tone={adoption.score >= 50 ? "success" : "warning"}
          />
          <StatCard
            label="Módulos ativos (30d)"
            value={adoption.distinctModules}
            hint={`${adoption.eventCount30d} eventos leves`}
          />
          <StatCard
            label="Incidentes críticos/altos"
            value={critical}
            hint="Em aberto ou em análise"
            tone={critical > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Sugestões pendentes"
            value={analytics.suggestionsPending}
            hint="Aguardando triagem"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card ring-soft p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[color:var(--warning)]" />
            <h2 className="text-sm font-semibold">Painel de incidentes</h2>
          </div>
          <button
            type="button"
            disabled={exportIncidents.isPending}
            onClick={async () => {
              const payload = await exportIncidents.mutateAsync();
              downloadJson(
                `medicflow-incidentes-piloto-${new Date().toISOString().slice(0, 10)}.json`,
                payload,
              );
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          >
            <Download className="h-3.5 w-3.5" /> Exportar incidentes
          </button>
        </div>
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {data.incidents.length === 0 ? (
            <li className="text-xs text-muted-foreground">Nenhum incidente registrado.</li>
          ) : (
            data.incidents.slice(0, 25).map((inc) => (
              <li key={inc.id} className="rounded-lg border border-border p-3 text-xs space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    {STATUS_LABELS[inc.incident_status] ?? inc.incident_status}
                  </span>
                  <span className="font-medium uppercase">{inc.severity}</span>
                  <span className="text-muted-foreground">{inc.operational_source}</span>
                </div>
                <p className="text-muted-foreground">{inc.description}</p>
                {canAdmin && editingId === inc.id ? (
                  <div className="space-y-2 pt-1">
                    <select
                      defaultValue={inc.incident_status}
                      onChange={(e) =>
                        void saveIncident(inc.id, {
                          incidentStatus: e.target.value as PilotIncidentStatus,
                        })
                      }
                      className="w-full rounded border border-border bg-background px-2 py-1"
                    >
                      <option value="open">Aberto</option>
                      <option value="investigating">Em análise</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Encerrado</option>
                    </select>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={2}
                      placeholder="Notas de resolução"
                      className="w-full rounded border border-border bg-background px-2 py-1 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void saveIncident(inc.id, {
                          resolutionNotes,
                          incidentStatus: "resolved",
                          followUpStatus: "done",
                        })
                      }
                      className="text-primary font-medium hover:underline"
                    >
                      Salvar e marcar resolvido
                    </button>
                  </div>
                ) : canAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(inc.id);
                      setResolutionNotes(inc.resolution_notes ?? "");
                    }}
                    className="text-primary hover:underline"
                  >
                    Gerenciar resolução
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card ring-soft p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Analytics leves (30 dias)</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Uso por módulo
            </h3>
            <ul className="space-y-1">
              {analytics.moduleUsage.length === 0 ? (
                <li className="text-muted-foreground">Sem eventos ainda.</li>
              ) : (
                analytics.moduleUsage.map((m) => (
                  <li key={m.module} className="flex justify-between">
                    <span>{m.module}</span>
                    <span className="font-medium">{m.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Uso por perfil
            </h3>
            <ul className="space-y-1">
              {analytics.profileUsage.map((p) => (
                <li key={p.role} className="flex justify-between">
                  <span>{p.role}</span>
                  <span className="font-medium">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Fluxos mais acessados
            </h3>
            <ul className="space-y-1 font-mono text-[10px]">
              {analytics.topRoutes.map((r) => (
                <li key={r.route} className="flex justify-between gap-2">
                  <span className="truncate">{r.route}</span>
                  <span className="shrink-0 font-medium">{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Gargalos leves
            </h3>
            {analytics.bottlenecks.length === 0 ? (
              <p className="text-muted-foreground">Nenhum gargalo detectado.</p>
            ) : (
              <ul className="space-y-2">
                {analytics.bottlenecks.map((b) => (
                  <li key={b.label} className="rounded-lg bg-muted/30 px-2 py-1.5">
                    <span className="font-medium">{b.label}</span> — {b.detail}
                  </li>
                ))}
              </ul>
            )}
            {analytics.avgOnboardingDays != null ? (
              <p className="mt-3 text-muted-foreground">
                Tempo médio estimado de onboarding: ~{analytics.avgOnboardingDays} dias
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {canAdmin ? (
        <div className="rounded-xl border border-border bg-card ring-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Feature flags piloto</h2>
            </div>
            <button
              type="button"
              onClick={() => void ensureFlags.mutateAsync()}
              disabled={ensureFlags.isPending}
              className="text-xs font-medium text-primary hover:underline"
            >
              Inicializar padrões
            </button>
          </div>
          <ul className="space-y-2">
            {data.flags.map((f) => (
              <li
                key={f.flag_key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-medium font-mono">{f.flag_key}</span>
                  {f.description ? (
                    <p className="text-muted-foreground mt-0.5">{f.description}</p>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) =>
                      void setFlag.mutateAsync({ flagKey: f.flag_key, enabled: e.target.checked })
                    }
                  />
                  <span>{f.enabled ? "Ativo" : "Off"}</span>
                </label>
              </li>
            ))}
            {data.flags.length === 0 ? (
              <li className="text-xs text-muted-foreground">
                Nenhuma flag — clique em Inicializar padrões.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card ring-soft p-5">
        <h2 className="text-sm font-semibold mb-3">Histórico recente de feedback</h2>
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {data.feedback.slice(0, 8).map((f) => (
              <li key={f.id} className="border-b border-border/50 pb-2">
                <span className="font-medium">{f.category}</span> · {f.severity}
                <p className="text-muted-foreground line-clamp-2 mt-0.5">{f.description}</p>
              </li>
            ))}
            {data.feedback.length === 0 ? (
              <li className="text-muted-foreground">Sem feedback ainda.</li>
            ) : null}
          </ul>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {data.suggestions.slice(0, 8).map((s) => (
              <li key={s.id} className="border-b border-border/50 pb-2">
                <span className="font-medium">{s.category}</span> · {s.suggestion_status}
                <p className="text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
              </li>
            ))}
            {data.suggestions.length === 0 ? (
              <li className="text-muted-foreground">Sem sugestões ainda.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
