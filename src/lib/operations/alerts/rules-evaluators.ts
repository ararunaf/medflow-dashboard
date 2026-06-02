import { OPERATIONAL_ALERT_THRESHOLDS as T } from "@/lib/operations/alerts/thresholds";
import { makeOperationalAlert } from "@/lib/operations/alerts/factories";
import {
  OPERATIONAL_ALERT_RULE_IDS,
  type OperationalAlert,
  type OperationalRuleContext,
} from "@/lib/operations/alerts/types";

function evalCoverage(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.coveragePercent < T.coverageCriticalMax) {
    return makeOperationalAlert({
      id: OPERATIONAL_ALERT_RULE_IDS.coverageLow,
      severity: "critical",
      title: "Cobertura abaixo do limiar",
      detail: `Cobertura confirmada na janela está em ${ctx.coveragePercent}% (meta mínima ${T.coverageCriticalMax}%). Priorize confirmações e alocação.`,
    });
  }
  if (ctx.coveragePercent < T.coverageWarningMax) {
    return makeOperationalAlert({
      id: OPERATIONAL_ALERT_RULE_IDS.coverageWatch,
      severity: "warning",
      title: "Cobertura em atenção",
      detail: `${ctx.coveragePercent}% confirmados — monitore buracos e pendências antes que pressione a operação.`,
    });
  }
  return null;
}

function evalOverdueOpens(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.overdueOpenShifts <= 0) return null;
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.overdueOpenShifts,
    severity: "critical",
    title: "Plantões abertos vencidos",
    detail: `${ctx.overdueOpenShifts} plantão(ões) ainda abertos com horário de início já passado na amostra analisada.`,
  });
}

function evalUnconfirmedSoon(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.unconfirmedStartingWithin24h < T.unconfirmedSoonWarning) return null;
  const sev =
    ctx.unconfirmedStartingWithin24h >= T.unconfirmedSoonCritical ? "critical" : "warning";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.unconfirmedStartingSoon,
    severity: sev,
    title: "Início próximo sem confirmação",
    detail: `${ctx.unconfirmedStartingWithin24h} plantão(ões) nas próximas 24h sem confirmação na janela.`,
  });
}

function evalOpenShiftsUrgency(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.openShifts < T.openShiftsElevated || ctx.unconfirmedStartingWithin24h < 1) return null;
  const sev =
    ctx.openShifts >= T.openShiftsElevated * 2 && ctx.unconfirmedStartingWithin24h >= 2
      ? "warning"
      : "info";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.openShiftsNearWindow,
    severity: sev,
    title: "Plantões abertos com janela apertada",
    detail: `${ctx.openShifts} plantões abertos no tenant e ${ctx.unconfirmedStartingWithin24h} sem confirmação nas próximas 24h na janela.`,
  });
}

function evalSwapsQueue(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.pendingSwaps < T.pendingSwapsWarning) return null;
  const sev = ctx.pendingSwaps >= T.pendingSwapsCritical ? "critical" : "warning";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure,
    severity: sev,
    title: "Fila de swaps pressionada",
    detail: `${ctx.pendingSwaps} solicitações pendentes — coordenação pode engarrafar.`,
  });
}

function evalSwapsCriticalHorizon(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.criticalSwapsInHorizon < T.criticalSwapsInHorizonWarning) return null;
  const sev =
    ctx.criticalSwapsInHorizon >= T.criticalSwapsInHorizonCritical ? "critical" : "warning";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon,
    severity: sev,
    title: "Swaps críticos no horizonte",
    detail: `${ctx.criticalSwapsInHorizon} troca(s) pendente(s) com plantão a iniciar em ≤48h.`,
  });
}

function evalAssignments(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.pendingAssignments < T.pendingAssignmentsWarning) return null;
  const sev = ctx.pendingAssignments >= T.pendingAssignmentsCritical ? "critical" : "warning";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.assignmentsPending,
    severity: sev,
    title: "Assignments pendentes em volume",
    detail: `${ctx.pendingAssignments} atribuições aguardando decisão.`,
  });
}

function evalConflicts(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.operationalConflicts < T.conflictsWarningMin) return null;
  let sev: OperationalAlert["severity"] = "info";
  if (ctx.operationalConflicts >= T.conflictsCriticalMin) sev = "critical";
  else if (ctx.operationalConflicts >= T.conflictsElevatedMin) sev = "warning";

  const multi =
    ctx.shiftsWithMultiplePending > 0
      ? `${ctx.shiftsWithMultiplePending} com múltiplas pendências. `
      : "";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.operationalConflicts,
    severity: sev,
    title: "Risco operacional — conflitos",
    detail: `${multi}${ctx.operationalConflicts} plantão(ões) com sinal de conflito na janela.`,
  });
}

function evalCoordinationPressure(ctx: OperationalRuleContext): OperationalAlert | null {
  if (ctx.operationalPressure !== "alta") return null;
  let sev: OperationalAlert["severity"] = "warning";
  if (
    (ctx.operationalConflicts > 0 && ctx.pendingSwaps >= T.pendingSwapsWarning) ||
    ctx.urgency === "critica"
  ) {
    sev = "critical";
  }
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.coordinationPressure,
    severity: sev,
    title: "Pressão operacional alta",
    detail:
      "Vários eixos (abertos, swaps, pendências ou cobertura) simultâneos — distribua atenção da coordenação.",
  });
}

function evalAvailability(ctx: OperationalRuleContext): OperationalAlert | null {
  const total = ctx.totalProfessionalsProxy;
  if (total <= 0) return null;

  if (ctx.availableProfessionals === 0 && total >= T.minProfessionalsForRatio) {
    return makeOperationalAlert({
      id: OPERATIONAL_ALERT_RULE_IDS.availabilityRisk,
      severity: "critical",
      title: "Indisponibilidade crítica",
      detail:
        "Nenhum profissional com disponibilidade ativa no tenant — revisão urgente de janelas.",
    });
  }

  const ratio = ctx.unavailableProfessionals / total;
  if (ratio < T.unavailableRatioWarning) return null;
  const sev = ratio >= T.unavailableRatioCritical ? "critical" : "warning";
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.availabilityRisk,
    severity: sev,
    title: "Indisponibilidade relevante",
    detail: `${Math.round(ratio * 100)}% do quadro sem disponibilidade ativa (${ctx.unavailableProfessionals}/${total}).`,
  });
}

function evalCappedSample(ctx: OperationalRuleContext): OperationalAlert | null {
  if (!ctx.cappedWindowSample) return null;
  return makeOperationalAlert({
    id: OPERATIONAL_ALERT_RULE_IDS.windowSampleCapped,
    severity: "info",
    title: "Métricas conservadoras",
    detail:
      "A janela de plantões atingiu o limite de amostra — cobertura e conflitos podem subestimar o cenário real.",
  });
}

const EVALUATORS: Array<(ctx: OperationalRuleContext) => OperationalAlert | null> = [
  evalCoverage,
  evalOverdueOpens,
  evalUnconfirmedSoon,
  evalSwapsQueue,
  evalSwapsCriticalHorizon,
  evalAssignments,
  evalConflicts,
  evalCoordinationPressure,
  evalAvailability,
  evalOpenShiftsUrgency,
  evalCappedSample,
];

export function evaluateOperationalRuleSteps(ctx: OperationalRuleContext): OperationalAlert[] {
  const byId = new Map<string, OperationalAlert>();
  for (const fn of EVALUATORS) {
    const a = fn(ctx);
    if (!a) continue;
    const prev = byId.get(a.id);
    if (!prev || compareSeverityLocal(a.severity, prev.severity) < 0) {
      byId.set(a.id, a);
    }
  }
  return [...byId.values()];
}

function compareSeverityLocal(
  a: OperationalAlert["severity"],
  b: OperationalAlert["severity"],
): number {
  const o = { critical: 0, warning: 1, info: 2 };
  return o[a] - o[b];
}
