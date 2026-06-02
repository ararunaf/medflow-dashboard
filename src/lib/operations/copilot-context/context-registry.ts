import type { OperationalContextSections } from "@/lib/operations/copilot-context/types";

/** Ordem canônica de seções na UI e em payloads serializados. */
export const OPERATIONAL_CONTEXT_SECTION_ORDER: Array<keyof OperationalContextSections> = [
  "currentOperationalState",
  "currentRisks",
  "predictedDeterioration",
  "operationalPressure",
  "coordinatorPriorities",
  "recommendationHighlights",
  "recentOperationalEvents",
  "learningSignals",
  "kpiTrendDigest",
];

export const OPERATIONAL_CONTEXT_SECTION_LABELS_PT: Record<
  keyof OperationalContextSections,
  string
> = {
  currentOperationalState: "Estado operacional atual",
  currentRisks: "Riscos atuais",
  predictedDeterioration: "Deterioração prevista",
  operationalPressure: "Pressão operacional",
  coordinatorPriorities: "Prioridades do coordenador",
  recommendationHighlights: "Destaques de recomendações",
  recentOperationalEvents: "Eventos operacionais recentes",
  learningSignals: "Sinais de aprendizado",
  kpiTrendDigest: "KPIs e tendências (período)",
};
