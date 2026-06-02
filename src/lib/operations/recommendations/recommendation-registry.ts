/**
 * Registro de metadados por gatilho — prioridade de ordenação e rótulos padrão.
 * Os textos finais podem ser refinados nas fábricas com números do snapshot.
 */
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";

export type RecommendationRegistryEntry = {
  /** Maior = mais prioritário na ordenação intra-estado. */
  sortWeight: number;
  defaultTitle: string;
};

export const OPERATIONAL_RECOMMENDATION_REGISTRY: Record<
  OperationalRecommendationTrigger,
  RecommendationRegistryEntry
> = {
  coverage_low: {
    sortWeight: 92,
    defaultTitle: "Reforçar cobertura na janela",
  },
  rising_risk: {
    sortWeight: 70,
    defaultTitle: "Intensificar monitoramento de risco",
  },
  predicted_deterioration: {
    sortWeight: 85,
    defaultTitle: "Mitigar deterioração prevista",
  },
  operational_pressure: {
    sortWeight: 78,
    defaultTitle: "Aliviar pressão operacional",
  },
  critical_swaps: {
    sortWeight: 88,
    defaultTitle: "Tratar swaps no horizonte crítico",
  },
  rising_unavailability: {
    sortWeight: 75,
    defaultTitle: "Aumentar backup de disponibilidade",
  },
  pending_assignments: {
    sortWeight: 80,
    defaultTitle: "Reduzir fila de assignments pendentes",
  },
  operational_conflicts: {
    sortWeight: 86,
    defaultTitle: "Resolver conflitos operacionais sinalizados",
  },
};
