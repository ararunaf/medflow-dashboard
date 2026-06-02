import {
  OPERATIONAL_ALERT_RULE_IDS,
  type OperationalAlertRuleId,
} from "@/lib/operations/alerts/types";
import type { OperationalContextAction, OperationalRouteTarget } from "./types";

/**
 * Mapeamento explícito alerta → ação primária de coordenação.
 * Regras determinísticas (sem ML): prepara futura camada de automação/IA.
 */
const PRIMARY: Partial<Record<OperationalAlertRuleId, OperationalContextAction>> = {
  [OPERATIONAL_ALERT_RULE_IDS.coverageLow]: {
    key: "act-coverage-open-shifts",
    label: "Plantões abertos",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.coverageLow,
    target: { to: "/plantoes", search: { tab: "disponiveis" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.coverageWatch]: {
    key: "act-coverage-watch-open",
    label: "Plantões abertos",
    priority: 1,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.coverageWatch,
    target: { to: "/plantoes", search: { tab: "disponiveis" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure]: {
    key: "act-swaps-queue",
    label: "Swaps pendentes",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure,
    target: { to: "/plantoes", search: { tab: "swaps" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon]: {
    key: "act-swaps-horizon",
    label: "Swaps pendentes",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon,
    target: { to: "/plantoes", search: { tab: "swaps" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.assignmentsPending]: {
    key: "act-assignments-queue",
    label: "Assignments na escala",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.assignmentsPending,
    target: { to: "/escalas", search: { opsFocus: "sem-confirmacao" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.operationalConflicts]: {
    key: "act-conflicts",
    label: "Conflitos na escala",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.operationalConflicts,
    target: { to: "/escalas", search: { opsFocus: "conflicts" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.availabilityRisk]: {
    key: "act-availability",
    label: "Disponíveis (central)",
    priority: 1,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.availabilityRisk,
    target: { to: "/central", search: { opsFocus: "availability" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.coordinationPressure]: {
    key: "act-pressure-detail",
    label: "Central detalhada",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.coordinationPressure,
    target: { to: "/central", search: { opsFocus: "detail" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.overdueOpenShifts]: {
    key: "act-overdue-opens",
    label: "Plantões abertos",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.overdueOpenShifts,
    target: { to: "/plantoes", search: { tab: "disponiveis" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.unconfirmedStartingSoon]: {
    key: "act-unconfirmed-soon",
    label: "Escala · sem confirmação",
    priority: 0,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.unconfirmedStartingSoon,
    target: { to: "/escalas", search: { opsFocus: "sem-confirmacao" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.openShiftsNearWindow]: {
    key: "act-open-near",
    label: "Plantões abertos",
    priority: 1,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.openShiftsNearWindow,
    target: { to: "/plantoes", search: { tab: "disponiveis" } },
  },
  [OPERATIONAL_ALERT_RULE_IDS.windowSampleCapped]: {
    key: "act-sample-cap",
    label: "Indicadores detalhados",
    priority: 3,
    sourceAlertId: OPERATIONAL_ALERT_RULE_IDS.windowSampleCapped,
    target: { to: "/central", search: { opsFocus: "detail" } },
  },
};

export function primaryActionForAlertRuleId(
  id: OperationalAlertRuleId,
): OperationalContextAction | null {
  return PRIMARY[id] ?? null;
}

export function routeTargetForAlertRuleId(
  id: OperationalAlertRuleId,
): OperationalRouteTarget | null {
  return PRIMARY[id]?.target ?? null;
}
