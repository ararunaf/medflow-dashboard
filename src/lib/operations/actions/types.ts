import type { OperationalAlertRuleId } from "@/lib/operations/alerts/types";

/** Destinos tipados para `Link` do TanStack Router (search serializável). */
export type OperationalRouteTarget =
  | { to: "/central"; search: CentralOpsSearch }
  | { to: "/plantoes"; search: PlantoesOpsSearch }
  | { to: "/escalas"; search: EscalasOpsSearch }
  | { to: "/perfil"; search?: Record<string, never> };

export type CentralOpsSearch = {
  opsFocus?:
    | "availability"
    | "pressure"
    | "coverage"
    | "swaps"
    | "conflicts"
    | "assignments"
    | "detail";
};

export type PlantoesOpsSearch = {
  tab?: "disponiveis" | "meus" | "swaps";
  assignmentFilter?: "pending";
};

export type EscalasOpsSearch = {
  opsFocus?: "conflicts" | "abertos" | "sem-confirmacao";
};

export type OperationalContextAction = {
  /** Identificador estável para keys React e telemetria futura */
  key: string;
  label: string;
  target: OperationalRouteTarget;
  /** 0 = mais urgente na UI */
  priority: number;
  sourceAlertId?: OperationalAlertRuleId;
};
