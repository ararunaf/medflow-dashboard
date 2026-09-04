import { createFileRoute } from "@tanstack/react-router";
import { brandPageTitle } from "@/lib/assets";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MedicalPayoutPanels } from "@/components/tiss/medical-payout-panels";
import { EmptyState, ErrorState, PageHeader, StatCard } from "@/components/ui-kit";
import { can } from "@/lib/auth/rbac";
import {
  tissFoundationQueryOptions,
  useInsuranceContractsQuery,
  useInsuranceRulesQuery,
  useTissBatchExportsQuery,
  useTissFoundationQuery,
  useTissMutations,
} from "@/hooks/use-tiss-foundation";
import {
  defaultCompetenceMonthUtc,
  medicalPayoutFoundationQueryOptions,
} from "@/hooks/use-medical-payout-foundation";
import { cn } from "@/lib/utils";
import type {
  TissAppealStatus,
  TissBatchStatus,
  TissDenialStatus,
  TissDenialType,
  TissGuideStatus,
  TissReturnStatus,
} from "@/lib/database.types";
import { describeError } from "@/lib/queries/result";
import {
  useHomologationReadinessQuery,
  useSetInsuranceProviderHomologationStatus,
} from "@/hooks/use-tiss-foundation";
import type { HomologationStatus } from "@/lib/services/tiss/homologation-readiness";
import {
  Ban,
  Building2,
  CheckCircle2,
  ClipboardList,
  Factory,
  HandCoins,
  Layers,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  Stethoscope,
  TrendingDown,
} from "lucide-react";

export const Route = createFileRoute("/tiss")({
  head: () => ({
    meta: [
      { title: brandPageTitle("TISS / Faturamento") },
      { name: "description", content: "Convênios, guias, lotes e exportação XML operacional." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(tissFoundationQueryOptions()).catch(() => undefined);
    await context.queryClient
      .prefetchQuery(medicalPayoutFoundationQueryOptions(defaultCompetenceMonthUtc()))
      .catch(() => undefined);
  },
  component: TissPage,
});

const tabs = [
  { id: "resumo", label: "Resumo", icon: LayoutDashboard },
  { id: "convenios", label: "Convênios", icon: Building2 },
  { id: "procedimentos", label: "TUSS", icon: Stethoscope },
  { id: "guias", label: "Guias", icon: ClipboardList },
  { id: "lotes", label: "Lotes", icon: Layers },
  { id: "producao", label: "Produção", icon: Factory },
  { id: "repasses", label: "Repasses", icon: HandCoins },
  { id: "glosas", label: "Glosas", icon: Ban },
  { id: "financeiro", label: "Perdas", icon: TrendingDown },
  { id: "recursos", label: "Recursos", icon: Scale },
  { id: "homologacao", label: "Homologação", icon: ShieldCheck },
] as const;

type TabId = (typeof tabs)[number]["id"];

function moneyBrl(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function guideStatusLabel(s: TissGuideStatus): string {
  const m: Record<TissGuideStatus, string> = {
    draft: "Rascunho",
    pending_review: "Em revisão",
    approved: "Aprovada",
    billed: "Faturada",
    denied: "Negada",
  };
  return m[s] ?? s;
}

function batchStatusLabel(s: TissBatchStatus): string {
  const m: Record<TissBatchStatus, string> = {
    open: "Aberto",
    closed: "Fechado",
    exported: "Exportado",
    processed: "Processado",
  };
  return m[s] ?? s;
}

function TissPage() {
  const [tab, setTab] = useState<TabId>("resumo");
  const [payoutCompetence, setPayoutCompetence] = useState(() => defaultCompetenceMonthUtc());
  const { auth } = Route.useRouteContext();
  const canPayoutWrite = can(auth.profile?.role ?? null, "payouts:write");
  const q = useTissFoundationQuery();
  const m = useTissMutations();

  if (q.isError) {
    return (
      <AppShell>
        <PageHeader title="TISS / Faturamento" subtitle="Fundação operacional" />
        <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />
      </AppShell>
    );
  }

  if (q.isLoading || !q.data) {
    return (
      <AppShell>
        <PageHeader title="TISS / Faturamento" subtitle="Carregando…" />
        <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />
      </AppShell>
    );
  }

  const d = q.data;
  const pending = d.billingSummary.pendingReviewCount;

  return (
    <AppShell>
      <PageHeader
        title="TISS / Faturamento"
        subtitle="Convênios, procedimentos TUSS, guias, lotes e XML (MVP auditável)."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "resumo" ? (
        <section className="space-y-6">
          {pending > 0 ? (
            <div className="rounded-xl border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Conferência:</span> {pending} guia(s) aguardando
              revisão.
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Valor total (guias)"
              value={moneyBrl(d.billingSummary.guidesTotalValue)}
              hint="soma das guias no tenant"
            />
            <StatCard
              label="Guias em revisão"
              value={pending}
              tone="warning"
              hint="pending_review"
            />
            <StatCard
              label="Lotes abertos (valor)"
              value={moneyBrl(d.billingSummary.openBatchValue)}
              hint="materializado por lote"
            />
            <StatCard
              label="Convênios ativos"
              value={d.insuranceProviders.filter((p) => p.active).length}
              icon={<Building2 className="h-4 w-4" />}
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="font-medium text-foreground mb-2">Guias por status</div>
            <ul className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
              {(Object.keys(d.billingSummary.guidesByStatus) as TissGuideStatus[]).map((k) => (
                <li key={k}>
                  <span className="text-foreground font-medium">
                    {d.billingSummary.guidesByStatus[k]}
                  </span>{" "}
                  {guideStatusLabel(k)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "convenios" ? <ConveniosPanel data={d} m={m} /> : null}
      {tab === "procedimentos" ? <ProcedimentosPanel data={d} m={m} /> : null}
      {tab === "guias" ? <GuiasPanel data={d} m={m} /> : null}
      {tab === "lotes" ? <LotesPanel data={d} m={m} /> : null}
      {tab === "glosas" ? <GlosasPanel data={d} m={m} /> : null}
      {tab === "financeiro" ? <FinanceiroOperacionalPanel data={d} /> : null}
      {tab === "producao" ? (
        <MedicalPayoutPanels
          mode="producao"
          competenceMonth={payoutCompetence}
          onCompetenceMonthChange={setPayoutCompetence}
          professionals={d.professionals}
          canPayoutWrite={canPayoutWrite}
        />
      ) : null}
      {tab === "repasses" ? (
        <MedicalPayoutPanels
          mode="repasses"
          competenceMonth={payoutCompetence}
          onCompetenceMonthChange={setPayoutCompetence}
          professionals={d.professionals}
          canPayoutWrite={canPayoutWrite}
        />
      ) : null}
      {tab === "recursos" ? <RecursosPanel data={d} m={m} /> : null}
      {tab === "homologacao" ? (
        <HomologacaoPanel canWrite={can(auth.profile?.role ?? null, "tiss:write")} />
      ) : null}
    </AppShell>
  );
}

function homologationStatusLabel(status: HomologationStatus): string {
  const m: Record<HomologationStatus, string> = {
    not_started: "Não iniciada",
    in_progress: "Em andamento",
    homologated: "Homologada",
  };
  return m[status];
}

function HomologationStatusBadge({ status }: { status: HomologationStatus }) {
  const map: Record<HomologationStatus, string> = {
    not_started: "bg-muted text-muted-foreground",
    in_progress: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
    homologated: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {homologationStatusLabel(status)}
    </span>
  );
}

function ReadinessCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-destructive/10 text-destructive",
        )}
      >
        {ok ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function HomologacaoPanel({ canWrite }: { canWrite: boolean }) {
  const q = useHomologationReadinessQuery();
  const setStatus = useSetInsuranceProviderHomologationStatus();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<HomologationStatus>("not_started");
  const [draftNotes, setDraftNotes] = useState("");

  if (q.isError) {
    return <ErrorState message={describeError(q.error).message} onRetry={() => void q.refetch()} />;
  }
  if (q.isLoading || !q.data) {
    return <div className="h-40 rounded-xl bg-muted/40 animate-pulse" />;
  }

  const { tenant, operators } = q.data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Prontidão institucional do tenant</h2>
        <p className="text-xs text-muted-foreground">
          Checagens únicas, válidas para toda submissão de homologação — não variam por operadora.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <ReadinessCheck
            ok={tenant.institutionalDataComplete}
            label={
              tenant.institutionalDataComplete
                ? "Dados institucionais completos"
                : `Dados institucionais incompletos: ${tenant.missingInstitutionalFields.join(", ")}`
            }
          />
          <ReadinessCheck
            ok={tenant.hasApprovedContractRule}
            label={
              tenant.hasApprovedContractRule
                ? "Ao menos uma regra de contrato aprovada"
                : "Nenhuma regra de contrato aprovada ainda"
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-1">Homologação por operadora</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Prontidão técnica (código ANS + guia emitida) e status do processo de homologação, que é uma
          ação institucional externa junto à operadora.
        </p>
        {operators.length === 0 ? (
          <EmptyState
            title="Nenhuma operadora cadastrada"
            description="Cadastre um convênio na aba Convênios para começar."
          />
        ) : (
          <div className="space-y-3">
            {operators.map((op) => {
              const isEditing = editingId === op.providerId;
              return (
                <div key={op.providerId} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{op.providerName}</div>
                      <div className="text-xs text-muted-foreground">
                        ANS: {op.ansCodeConfigured ? "configurado" : "não configurado"}
                        {!op.active ? " · inativo" : ""}
                      </div>
                    </div>
                    <HomologationStatusBadge status={op.homologationStatus} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <ReadinessCheck ok={op.ansCodeConfigured} label="Código ANS cadastrado" />
                    <ReadinessCheck ok={op.hasBilledGuide} label="Ao menos uma guia TISS emitida" />
                  </div>

                  {op.homologationNotes ? (
                    <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                      {op.homologationNotes}
                    </p>
                  ) : null}
                  {op.homologatedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Homologada em {new Date(op.homologatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  ) : null}

                  {canWrite ? (
                    isEditing ? (
                      <div className="space-y-2 pt-1">
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={draftStatus}
                          onChange={(e) => setDraftStatus(e.target.value as HomologationStatus)}
                        >
                          <option value="not_started">Não iniciada</option>
                          <option value="in_progress">Em andamento</option>
                          <option value="homologated">Homologada</option>
                        </select>
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Notas do processo (opcional)"
                          rows={2}
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={setStatus.isPending}
                            onClick={() =>
                              setStatus.mutate(
                                { providerId: op.providerId, status: draftStatus, notes: draftNotes },
                                { onSuccess: () => setEditingId(null) },
                              )
                            }
                            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(op.providerId);
                          setDraftStatus(op.homologationStatus);
                          setDraftNotes(op.homologationNotes ?? "");
                        }}
                        className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted/50"
                      >
                        Atualizar status
                      </button>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ConveniosPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [name, setName] = useState("");
  const [ans, setAns] = useState("");
  const [selProvider, setSelProvider] = useState<string | null>(null);
  const [contractNum, setContractNum] = useState("");
  const [contractName, setContractName] = useState("");
  const [selContract, setSelContract] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const contractsQ = useInsuranceContractsQuery(selProvider);
  const rulesQ = useInsuranceRulesQuery(selContract);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Novo convênio</h2>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Código ANS (opcional)"
          value={ans}
          onChange={(e) => setAns(e.target.value)}
        />
        <button
          type="button"
          disabled={m.createProvider.isPending || !name.trim()}
          onClick={() =>
            m.createProvider.mutate(
              { name: name.trim(), ansCode: ans.trim() || undefined },
              { onSuccess: () => setName("") },
            )
          }
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Salvar convênio
        </button>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Convênios</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.insuranceProviders.length === 0 ? (
            <EmptyState title="Nenhum convênio" description="Cadastre o primeiro à esquerda." />
          ) : (
            data.insuranceProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelProvider(p.id);
                  setSelContract(null);
                }}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 text-sm",
                  selProvider === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">ANS: {p.ans_code || "—"}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3 lg:col-span-2">
        <h2 className="text-sm font-semibold">Contratos e regras</h2>
        {!selProvider ? (
          <p className="text-sm text-muted-foreground">Selecione um convênio para ver contratos.</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Número do contrato"
                value={contractNum}
                onChange={(e) => setContractNum(e.target.value)}
              />
              <input
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Nome do contrato (opcional)"
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={m.createContract.isPending || !contractNum.trim()}
              onClick={() =>
                m.createContract.mutate(
                  {
                    insuranceProviderId: selProvider,
                    contractNumber: contractNum.trim(),
                    name: contractName.trim() || undefined,
                  },
                  { onSuccess: () => void contractsQ.refetch() },
                )
              }
              className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
            >
              Adicionar contrato
            </button>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Contratos
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(
                    (contractsQ.data ?? []) as Array<{
                      id: string;
                      contract_number: string;
                      name: string;
                    }>
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelContract(c.id)}
                      className={cn(
                        "w-full text-left rounded-md border px-2 py-1.5 text-xs",
                        selContract === c.id ? "border-primary" : "border-border",
                      )}
                    >
                      {c.contract_number} {c.name ? `— ${c.name}` : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Regras (MVP)
                </div>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
                  placeholder="Nome da regra"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!selContract || m.createRule.isPending || !ruleName.trim()}
                  onClick={() =>
                    m.createRule.mutate(
                      { insuranceContractId: selContract!, name: ruleName.trim(), parameters: {} },
                      {
                        onSuccess: () => {
                          setRuleName("");
                          void rulesQ.refetch();
                        },
                      },
                    )
                  }
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  Salvar regra
                </button>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                  {((rulesQ.data ?? []) as Array<{ id: string; name: string }>).map((r) => (
                    <li key={r.id}>{r.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProcedimentosPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [defVal, setDefVal] = useState("0");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Novo procedimento TUSS</h2>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Código TUSS"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Descrição"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Valor padrão"
          value={defVal}
          onChange={(e) => setDefVal(e.target.value)}
        />
        <button
          type="button"
          disabled={m.createProcedure.isPending || !code.trim() || !desc.trim()}
          onClick={() =>
            m.createProcedure.mutate(
              {
                code: code.trim(),
                description: desc.trim(),
                defaultValue: Number(defVal.replace(",", ".")) || 0,
              },
              {
                onSuccess: () => {
                  setCode("");
                  setDesc("");
                  setDefVal("0");
                },
              },
            )
          }
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Cadastrar
        </button>
        <p className="text-xs text-muted-foreground">
          Catálogo global: apenas perfis com permissão de catálogo (coordenação / admin).
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Catálogo ativo</div>
        <div className="max-h-[480px] overflow-y-auto divide-y divide-border">
          {data.tussProcedures.map((p) => (
            <div key={p.id} className="px-4 py-2 text-sm">
              <div className="font-mono text-xs text-primary">{p.code}</div>
              <div>{p.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {moneyBrl(Number(p.default_value))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuiasPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [patient, setPatient] = useState("");
  const [providerId, setProviderId] = useState("");
  const [profId, setProfId] = useState("");
  const [gtype, setGtype] = useState("consulta");
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cardNumber, setCardNumber] = useState("");
  const [isNewborn, setIsNewborn] = useState(false);
  const [regimeAtendimento, setRegimeAtendimento] = useState("");
  const [caraterAtendimento, setCaraterAtendimento] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [itemGuide, setItemGuide] = useState<string | null>(null);
  const [procId, setProcId] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("");
  const [execDate, setExecDate] = useState(() => new Date().toISOString().slice(0, 10));

  const providers = useMemo(
    () => data.insuranceProviders.filter((x) => x.active),
    [data.insuranceProviders],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <h2 className="text-sm font-semibold md:col-span-2 lg:col-span-3">Nova guia</h2>
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Paciente"
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
        />
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
        >
          <option value="">Convênio…</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={profId}
          onChange={(e) => setProfId(e.target.value)}
        >
          <option value="">Profissional…</option>
          {data.professionals.map((pr: { id: string; crm: string; specialty: string }) => (
            <option key={pr.id} value={pr.id}>
              {pr.crm} — {pr.specialty || "—"}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={gtype}
          onChange={(e) => setGtype(e.target.value)}
        >
          <option value="consulta">Consulta</option>
          <option value="sadt">SADT</option>
          <option value="honorario_individual">Honorário individual</option>
        </select>
        <input
          type="date"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={attDate}
          onChange={(e) => setAttDate(e.target.value)}
        />
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Número da carteirinha"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={isNewborn} onChange={(e) => setIsNewborn(e.target.checked)} />
          Atendimento de recém-nascido
        </label>
        {gtype !== "honorario_individual" && (
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={regimeAtendimento}
            onChange={(e) => setRegimeAtendimento(e.target.value)}
          >
            <option value="">Regime de atendimento…</option>
            <option value="01">Ambulatorial</option>
            <option value="02">Domiciliar</option>
            <option value="03">Internação</option>
            <option value="04">Pronto Socorro</option>
            <option value="05">Telessaúde</option>
          </select>
        )}
        {gtype === "sadt" && (
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={caraterAtendimento}
            onChange={(e) => setCaraterAtendimento(e.target.value)}
          >
            <option value="">Caráter de atendimento…</option>
            <option value="1">Eletiva</option>
            <option value="2">Urgência/Emergência</option>
          </select>
        )}
        {gtype === "sadt" && (
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={tipoAtendimento}
            onChange={(e) => setTipoAtendimento(e.target.value)}
          >
            <option value="">Tipo de atendimento…</option>
            <option value="01">Remoção</option>
            <option value="02">Pequena cirurgia</option>
            <option value="03">Outras terapias</option>
            <option value="04">Consulta</option>
            <option value="08">Quimioterapia</option>
            <option value="09">Radioterapia</option>
            <option value="10">Terapia renal substitutiva</option>
            <option value="13">Pequenos atendimentos</option>
            <option value="23">Telessaúde</option>
          </select>
        )}
        {gtype === "consulta" && (
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={tipoConsulta}
            onChange={(e) => setTipoConsulta(e.target.value)}
          >
            <option value="">Tipo de consulta…</option>
            <option value="1">Primeira</option>
            <option value="2">Seguimento</option>
            <option value="3">Pré-natal</option>
            <option value="4">Outras</option>
          </select>
        )}
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={m.createGuide.isPending || !patient.trim() || !providerId || !profId}
          onClick={() =>
            m.createGuide.mutate({
              guideType: gtype,
              patientName: patient.trim(),
              insuranceProviderId: providerId,
              insuranceContractId: null,
              professionalId: profId,
              attendanceDate: attDate,
              beneficiaryCardNumber: cardNumber.trim() || null,
              beneficiaryIsNewborn: isNewborn,
              regimeAtendimento: regimeAtendimento || null,
              caraterAtendimento: caraterAtendimento || null,
              tipoAtendimento: tipoAtendimento || null,
              tipoConsulta: tipoConsulta || null,
            })
          }
        >
          Criar guia
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">Guias</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Paciente</th>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Data</th>
                <th className="text-right px-4 py-2">Valor</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tissGuides.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2">{g.patient_name}</td>
                  <td className="px-4 py-2">{g.guide_type}</td>
                  <td className="px-4 py-2">{g.attendance_date}</td>
                  <td className="px-4 py-2 text-right">{moneyBrl(Number(g.total_value))}</td>
                  <td className="px-4 py-2">{guideStatusLabel(g.status)}</td>
                  <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                    {g.status === "draft" ? (
                      <button
                        type="button"
                        className="text-xs text-primary font-medium"
                        onClick={() =>
                          m.setGuideStatus.mutate({ guideId: g.id, status: "pending_review" })
                        }
                      >
                        Revisão
                      </button>
                    ) : null}
                    {g.status === "pending_review" ? (
                      <>
                        <button
                          type="button"
                          className="text-xs text-[color:var(--success)] font-medium"
                          onClick={() =>
                            m.setGuideStatus.mutate({ guideId: g.id, status: "approved" })
                          }
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="text-xs text-destructive font-medium"
                          onClick={() =>
                            m.setGuideStatus.mutate({ guideId: g.id, status: "denied" })
                          }
                        >
                          Negar
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs text-muted-foreground"
                      onClick={() => setItemGuide(itemGuide === g.id ? null : g.id)}
                    >
                      Itens
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {itemGuide ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-semibold">Itens da guia {itemGuide.slice(0, 8)}…</div>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={procId}
              onChange={(e) => setProcId(e.target.value)}
            >
              <option value="">Procedimento…</option>
              {data.tussProcedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
            <input
              className="w-20 rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <input
              className="w-28 rounded-md border border-input bg-background px-2 py-2 text-sm"
              placeholder="Valor unit."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <input
              type="date"
              className="rounded-md border border-input px-2 py-2 text-sm"
              value={execDate}
              onChange={(e) => setExecDate(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              disabled={!procId || m.addGuideItem.isPending}
              onClick={() =>
                m.addGuideItem.mutate({
                  guideId: itemGuide,
                  procedureId: procId,
                  quantity: Number(qty) || 1,
                  unitValue: Number(unit.replace(",", ".")) || 0,
                  executionDate: execDate,
                })
              }
            >
              Adicionar item
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LotesPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [competence, setCompetence] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [exportBatchId, setExportBatchId] = useState<string | null>(null);
  const [batchForLink, setBatchForLink] = useState("");
  const [guideForLink, setGuideForLink] = useState("");
  const exportsQ = useTissBatchExportsQuery(exportBatchId);

  const openBatches = data.tissBatches.filter((b) => b.status === "open");
  const approvedGuides = data.tissGuides.filter((g) => g.status === "approved" && !g.batch_id);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Competência (mês)</label>
          <input
            type="date"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={competence}
            onChange={(e) => setCompetence(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          onClick={() => m.createBatch.mutate({ competence })}
        >
          Abrir lote
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Lotes</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-4 py-2">Número</th>
              <th className="text-left px-4 py-2">Competência</th>
              <th className="text-right px-4 py-2">Guias</th>
              <th className="text-right px-4 py-2">Valor</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.tissBatches.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-2 font-mono text-xs">{b.batch_number}</td>
                <td className="px-4 py-2">{b.competence}</td>
                <td className="px-4 py-2 text-right">{b.total_guides}</td>
                <td className="px-4 py-2 text-right">{moneyBrl(Number(b.total_value))}</td>
                <td className="px-4 py-2">{batchStatusLabel(b.status)}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => setExportBatchId(b.id)}
                  >
                    Exportações
                  </button>
                  {b.status === "open" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-foreground"
                      onClick={() => m.closeBatch.mutate({ batchId: b.id })}
                    >
                      Fechar
                    </button>
                  ) : null}
                  {b.status === "closed" || b.status === "exported" ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary"
                      onClick={() =>
                        m.exportBatchXml.mutateAsync({ batchId: b.id }).then((raw) => {
                          const { xml } = raw as { xml: string };
                          const blob = new Blob([xml], {
                            type: "application/xml;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `tiss-${b.batch_number}.xml`;
                          a.click();
                          URL.revokeObjectURL(url);
                        })
                      }
                    >
                      XML
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold mb-2">Vincular guia aprovada ao lote aberto</div>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-2"
            value={batchForLink}
            onChange={(e) => setBatchForLink(e.target.value)}
          >
            <option value="">Selecione o lote…</option>
            {openBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_number} ({b.status})
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={guideForLink}
            onChange={(e) => setGuideForLink(e.target.value)}
          >
            <option value="">Guia aprovada…</option>
            {approvedGuides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.patient_name} — {moneyBrl(Number(g.total_value))}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="mt-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={!batchForLink || !guideForLink}
            onClick={() => {
              m.assignGuide.mutate(
                { guideId: guideForLink, batchId: batchForLink },
                { onSuccess: () => setGuideForLink("") },
              );
            }}
          >
            Vincular
          </button>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Histórico de exportações</div>
          {!exportBatchId ? (
            <p className="text-xs text-muted-foreground">
              Clique &quot;Exportações&quot; em um lote.
            </p>
          ) : exportsQ.isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando…</p>
          ) : (
            <ul className="text-xs space-y-2 max-h-48 overflow-y-auto">
              {(exportsQ.data ?? []).map((ex) => (
                <li key={ex.id} className="border border-border rounded-md p-2">
                  <div className="font-mono">{ex.checksum_sha256.slice(0, 12)}…</div>
                  <div className="text-muted-foreground">
                    {ex.byte_length} bytes · {ex.created_at}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function returnStatusLabel(s: TissReturnStatus): string {
  const m: Record<TissReturnStatus, string> = {
    received: "Recebido",
    processing: "Processando",
    processed: "Processado",
    failed: "Falha",
  };
  return m[s] ?? s;
}

function denialTypeLabel(t: TissDenialType): string {
  const m: Record<TissDenialType, string> = {
    partial: "Parcial",
    total: "Total",
    administrative: "Administrativa",
    technical: "Técnica",
  };
  return m[t] ?? t;
}

function denialStatusLabel(s: TissDenialStatus): string {
  const m: Record<TissDenialStatus, string> = {
    identified: "Identificada",
    under_review: "Em análise",
    appealed: "Em recurso",
    reversed: "Revertida",
    accepted: "Aceita",
  };
  return m[s] ?? s;
}

function appealStatusLabel(s: TissAppealStatus): string {
  const m: Record<TissAppealStatus, string> = {
    pending: "Pendente",
    submitted: "Enviado",
    under_review: "Em análise",
    accepted: "Deferido",
    rejected: "Indeferido",
    withdrawn: "Retirado",
  };
  return m[s] ?? s;
}

function GlosasPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [retBatch, setRetBatch] = useState("");
  const [retRef, setRetRef] = useState("");
  const [denReturn, setDenReturn] = useState("");
  const [denGuide, setDenGuide] = useState("");
  const [denType, setDenType] = useState<TissDenialType>("partial");
  const [denCode, setDenCode] = useState("");
  const [denDesc, setDenDesc] = useState("");
  const [denVal, setDenVal] = useState("");

  const selReturn = data.tissReturns.find((r) => r.id === denReturn);
  const guidesForReturn = selReturn
    ? data.tissGuides.filter((g) => g.batch_id === selReturn.batch_id)
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Registrar retorno TISS</h2>
        <p className="text-xs text-muted-foreground">
          Vincula o arquivo de retorno ao lote exportado (referência livre para rastreio
          operacional).
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[200px]"
            value={retBatch}
            onChange={(e) => setRetBatch(e.target.value)}
          >
            <option value="">Lote…</option>
            {data.tissBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_number} · {b.competence}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm flex-1 min-w-[180px]"
            placeholder="Referência do retorno (protocolo / arquivo)"
            value={retRef}
            onChange={(e) => setRetRef(e.target.value)}
          />
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            disabled={!retBatch || !retRef.trim() || m.createReturn.isPending}
            onClick={() =>
              m.createReturn.mutate(
                { batchId: retBatch, returnReference: retRef.trim() },
                { onSuccess: () => setRetRef("") },
              )
            }
          >
            Salvar retorno
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Retornos</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-4 py-2">Referência</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Processado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.tissReturns.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-mono text-xs">{r.return_reference}</td>
                <td className="px-4 py-2">{returnStatusLabel(r.status)}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.processed_at ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  {r.status !== "processed" ? (
                    <button
                      type="button"
                      className="text-xs text-primary font-medium"
                      onClick={() =>
                        m.updateReturnStatus.mutate({ returnId: r.id, status: "processed" })
                      }
                    >
                      Marcar processado
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.tissReturns.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Nenhum retorno" description="Registre o primeiro retorno acima." />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Nova glosa</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={denReturn}
            onChange={(e) => {
              setDenReturn(e.target.value);
              setDenGuide("");
            }}
          >
            <option value="">Retorno…</option>
            {data.tissReturns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.return_reference}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={denGuide}
            onChange={(e) => setDenGuide(e.target.value)}
            disabled={!denReturn}
          >
            <option value="">Guia do lote…</option>
            {guidesForReturn.map((g) => (
              <option key={g.id} value={g.id}>
                {g.patient_name} — {moneyBrl(Number(g.total_value))}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={denType}
            onChange={(e) => setDenType(e.target.value as TissDenialType)}
          >
            <option value="partial">{denialTypeLabel("partial")}</option>
            <option value="total">{denialTypeLabel("total")}</option>
            <option value="administrative">{denialTypeLabel("administrative")}</option>
            <option value="technical">{denialTypeLabel("technical")}</option>
          </select>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Código do motivo"
            value={denCode}
            onChange={(e) => setDenCode(e.target.value)}
          />
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
            placeholder="Descrição do motivo"
            value={denDesc}
            onChange={(e) => setDenDesc(e.target.value)}
          />
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Valor glosado (R$)"
            value={denVal}
            onChange={(e) => setDenVal(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={
            !denReturn ||
            !denGuide ||
            m.createDenial.isPending ||
            !Number.isFinite(Number(denVal.replace(",", ".")))
          }
          onClick={() =>
            m.createDenial.mutate({
              returnId: denReturn,
              guideId: denGuide,
              denialType: denType,
              denialReasonCode: denCode,
              denialReasonDescription: denDesc,
              deniedValue: Number(denVal.replace(",", ".")),
            })
          }
        >
          Registrar glosa
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">
          Glosas registradas
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="text-left px-4 py-2">Tipo</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Valor</th>
                <th className="text-left px-4 py-2">Motivo</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tissDenials.map((x) => (
                <tr key={x.id}>
                  <td className="px-4 py-2">{denialTypeLabel(x.denial_type)}</td>
                  <td className="px-4 py-2">{denialStatusLabel(x.status)}</td>
                  <td className="px-4 py-2 text-right">{moneyBrl(Number(x.denied_value))}</td>
                  <td className="px-4 py-2 text-xs font-mono">{x.denial_reason_code || "—"}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {x.status !== "reversed" ? (
                      <button
                        type="button"
                        className="text-xs text-primary"
                        onClick={() =>
                          m.updateDenial.mutate({ denialId: x.id, status: "reversed" })
                        }
                      >
                        Reverter
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinanceiroOperacionalPanel({
  data,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
}) {
  const loss = data.operationalLoss;
  const provName = (id: string) =>
    data.insuranceProviders.find((p) => p.id === id)?.name ?? id.slice(0, 8);
  const profLabel = (id: string) => {
    const pr = data.professionals.find((p) => p.id === id);
    return pr ? `${pr.crm} · ${pr.specialty}` : id.slice(0, 8);
  };
  const batchLabel = (id: string) =>
    data.tissBatches.find((b) => b.id === id)?.batch_number ?? id.slice(0, 8);

  const pct =
    loss.deniedPercentOfGuidesValue !== null
      ? `${(loss.deniedPercentOfGuidesValue * 100).toFixed(1)} %`
      : "—";

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground max-w-3xl">
        Indicadores derivados de rollups incrementais (sem DRE nem repasse contábil). O percentual
        contrasta a exposição glosada com o valor total das guias no tenant (proxy operacional).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total glosado (exposição)"
          value={moneyBrl(loss.totalDeniedExposure)}
          hint="exceto revertidas"
        />
        <StatCard label="Percentual vs guias" value={pct} hint="operacional, não contábil" />
        <StatCard
          label="Base guias (valor)"
          value={moneyBrl(loss.guidesBilledValueProxy)}
          hint="resumo TISS"
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Ranking — convênios</div>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            {loss.topInsuranceProviders.map((r) => (
              <li key={r.insurance_provider_id}>
                <span className="text-foreground font-medium">
                  {provName(r.insurance_provider_id)}
                </span>{" "}
                {moneyBrl(r.denied_exposure)}
              </li>
            ))}
          </ol>
          {loss.topInsuranceProviders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem dados agregados ainda.</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Ranking — profissionais</div>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            {loss.topProfessionals.map((r) => (
              <li key={r.professional_id}>
                <span className="text-foreground font-medium">{profLabel(r.professional_id)}</span>{" "}
                {moneyBrl(r.denied_exposure)}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Ranking — lotes</div>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            {loss.topBatches.map((r) => (
              <li key={r.batch_id}>
                <span className="text-foreground font-medium">{batchLabel(r.batch_id)}</span>{" "}
                {moneyBrl(r.denied_exposure)}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-3">Ranking — motivos (código)</div>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            {loss.topDenialReasons.map((r) => (
              <li key={r.denial_reason_code}>
                <span className="text-foreground font-medium">{r.denial_reason_code}</span>{" "}
                {moneyBrl(r.denied_exposure)}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function RecursosPanel({
  data,
  m,
}: {
  data: NonNullable<ReturnType<typeof useTissFoundationQuery>["data"]>;
  m: ReturnType<typeof useTissMutations>;
}) {
  const [apDenial, setApDenial] = useState("");
  const [apText, setApText] = useState("");

  const appealStatusOptions: readonly TissAppealStatus[] = [
    "pending",
    "submitted",
    "under_review",
    "accepted",
    "rejected",
    "withdrawn",
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Novo recurso</h2>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={apDenial}
          onChange={(e) => setApDenial(e.target.value)}
        >
          <option value="">Glosa…</option>
          {data.tissDenials
            .filter((d) => d.status !== "reversed")
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.id.slice(0, 8)}… — {denialTypeLabel(d.denial_type)} —{" "}
                {moneyBrl(Number(d.denied_value))}
              </option>
            ))}
        </select>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[88px]"
          placeholder="Fundamentação do recurso"
          value={apText}
          onChange={(e) => setApText(e.target.value)}
        />
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={!apDenial || !apText.trim() || m.createAppeal.isPending}
          onClick={() =>
            m.createAppeal.mutate(
              { denialId: apDenial, appealReason: apText.trim() },
              { onSuccess: () => setApText("") },
            )
          }
        >
          Registrar recurso
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-sm font-semibold">Recursos</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-4 py-2">Glosa</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Motivo</th>
              <th className="text-right px-4 py-2">Atualizar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.tissDenialAppeals.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 font-mono text-xs">{a.denial_id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{appealStatusLabel(a.appeal_status)}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground max-w-[240px] truncate">
                  {a.appeal_reason}
                </td>
                <td className="px-4 py-2 text-right">
                  <select
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    value={a.appeal_status}
                    onChange={(e) =>
                      m.updateAppealStatus.mutate({
                        appealId: a.id,
                        appealStatus: e.target.value as TissAppealStatus,
                      })
                    }
                  >
                    {appealStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {appealStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.tissDenialAppeals.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState
              title="Nenhum recurso"
              description="Crie um recurso vinculado a uma glosa."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
