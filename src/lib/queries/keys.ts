/**
 * Fábrica única de query keys do MedFlow-IA.
 *
 * Convenções:
 *   - Toda key começa por `['operations']` para permitir
 *     `queryClient.invalidateQueries({ queryKey: opsKeys.all })`
 *     em logout / troca de tenant.
 *   - Cada recurso possui um namespace + variantes específicas
 *     (`list`, `mine`, `pending`, …) para invalidação granular.
 *   - `as const` é mandatório para preservar a tupla literal.
 */

export const opsKeys = {
  all: ["operations"] as const,

  dashboard: () => [...opsKeys.all, "dashboard"] as const,

  /** Agregado do command center (cobertura, pressão, conflitos). */
  commandCenter: () => [...opsKeys.all, "command-center"] as const,

  /** Analytics operacional (KPIs históricos, tendências leves). */
  operationalAnalytics: () => [...opsKeys.all, "operational-analytics"] as const,

  // schedules
  schedules: () => [...opsKeys.all, "schedules"] as const,

  // shifts
  //
  // `hospitalId` é sempre um sufixo OPCIONAL (só aparece no array quando
  // presente) — assim `invalidateQueries({ queryKey: opsKeys.shiftsOpen() })`
  // (sem filtro) continua batendo, por prefixo, em toda variante já cacheada
  // com um hospitalId específico. Se virasse um elemento fixo (ex.: sempre
  // incluir `hospitalId ?? null`), a invalidação ampla pararia de alcançar
  // as variantes filtradas.
  shifts: () => [...opsKeys.all, "shifts"] as const,
  shiftsOpen: (hospitalId?: string) =>
    hospitalId
      ? ([...opsKeys.shifts(), "open", hospitalId] as const)
      : ([...opsKeys.shifts(), "open"] as const),
  shiftsRange: (fromISO?: string, toISO?: string, hospitalId?: string) =>
    hospitalId
      ? ([
          ...opsKeys.shifts(),
          "range",
          { from: fromISO ?? null, to: toISO ?? null },
          hospitalId,
        ] as const)
      : ([...opsKeys.shifts(), "range", { from: fromISO ?? null, to: toISO ?? null }] as const),
  shiftsMine: () => [...opsKeys.shifts(), "mine"] as const,
  shiftDetail: (shiftId: string) => [...opsKeys.shifts(), "detail", shiftId] as const,

  // institutions (hospitals + afiliação profissional↔hospital)
  hospitals: () => [...opsKeys.all, "hospitals"] as const,
  professionalAffiliations: () => [...opsKeys.all, "professional-affiliations"] as const,

  /** Grupos de trabalho (F5-S1). */
  workGroups: () => [...opsKeys.all, "work-groups"] as const,

  // assignments
  assignments: () => [...opsKeys.all, "assignments"] as const,
  assignmentsMine: () => [...opsKeys.assignments(), "mine"] as const,

  // swaps
  swaps: () => [...opsKeys.all, "swaps"] as const,
  swapsMine: () => [...opsKeys.swaps(), "mine"] as const,
  swapsPending: () => [...opsKeys.swaps(), "pending"] as const,
  swapTargets: () => [...opsKeys.swaps(), "targets"] as const,

  // availability
  availability: () => [...opsKeys.all, "availability"] as const,
  availabilityMine: () => [...opsKeys.availability(), "mine"] as const,

  // profile / me
  me: () => [...opsKeys.all, "me"] as const,

  /** Timeline / audit operacional (invalidação ampla por simplicidade). */
  timeline: () => [...opsKeys.all, "operational-timeline"] as const,

  /** Propostas de ação operacional (IA supervisionada). */
  actionProposals: () => [...opsKeys.all, "operational-action-proposals"] as const,

  /** Histórico de execuções supervisionadas de mutações por proposta. */
  mutationExecutions: (proposalId: string) =>
    [...opsKeys.all, "operational-mutation-executions", proposalId] as const,

  /** Orquestrações operacionais supervisionadas (multi-passo). */
  orchestrations: () => [...opsKeys.all, "operational-orchestrations"] as const,
  orchestration: (id: string) => [...opsKeys.orchestrations(), id] as const,

  /** Agentes operacionais supervisionados (domínio escopado). */
  operationalAgents: () => [...opsKeys.all, "operational-agents"] as const,

  /** Coordenação colaborativa multi-agente (supervisionada). */
  agentCoordination: () => [...opsKeys.all, "operational-agent-coordination"] as const,

  /** Fundação TISS / faturamento operacional. */
  tissFoundation: () => [...opsKeys.all, "tiss-foundation"] as const,
  tissBatchExports: (batchId: string) => [...opsKeys.tissFoundation(), "exports", batchId] as const,
  tissHomologation: () => [...opsKeys.all, "tiss-homologation"] as const,

  /** Produção médica + repasses operacionais por competência. */
  medicalPayoutFoundation: (competenceMonth: string) =>
    [...opsKeys.all, "medical-payout-foundation", competenceMonth] as const,

  /** Fechamento financeiro operacional por competência. */
  financialClosingsList: (search?: string) =>
    [...opsKeys.all, "financial-closings", { search: search ?? "" }] as const,
  financialClosingDetail: (closingId: string) =>
    [...opsKeys.all, "financial-closing-detail", closingId] as const,

  /** Conciliação operacional (esperado vs recebido, matching, divergências). */
  operationalReconciliationsList: (search?: string) =>
    [...opsKeys.all, "operational-reconciliations", { search: search ?? "" }] as const,
  operationalReconciliationDetail: (reconciliationId: string) =>
    [...opsKeys.all, "operational-reconciliation-detail", reconciliationId] as const,

  /** Dashboard executivo (KPIs financeiros operacionais + notificações). */
  executiveDashboardBundle: (competenceMonth?: string) =>
    [...opsKeys.all, "executive-dashboard-bundle", competenceMonth ?? ""] as const,

  /** Relatório de produção por grupo de trabalho (F5-S1). */
  workGroupProduction: (competenceMonth: string) =>
    [...opsKeys.all, "work-group-production", competenceMonth] as const,

  /** Parametrização institucional + readiness (server bundle). */
  operationalReadiness: () => [...opsKeys.all, "operational-readiness"] as const,

  /** Bundle de monitoramento (health, erros, logs, métricas). */
  operationalMonitoring: () => [...opsKeys.all, "operational-monitoring"] as const,

  /** Branding leve (RLS): cache curto no browser. */
  tenantSettings: () => [...opsKeys.all, "tenant-settings"] as const,

  /** Execução piloto V1 — feedback, incidentes, adoção, flags. */
  pilotExecution: (onboardingPercent?: number) =>
    [...opsKeys.all, "pilot-execution", onboardingPercent ?? 0] as const,

  /** Produção, release checklist, smoke tests e backup readiness. */
  productionRelease: () => [...opsKeys.all, "production-release"] as const,

  /** Landing comercial pública (cache longo). */
  publicLanding: () => [...opsKeys.all, "public-landing"] as const,
} as const;

export type OpsKey = ReturnType<
  (typeof opsKeys)[keyof typeof opsKeys] extends () => infer R ? () => R : never
>;
