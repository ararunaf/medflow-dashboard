/**
 * Registro de orientações operacionais reutilizáveis (base para copiloto futuro).
 * Mantém linguagem acionável sem executar ações automaticamente.
 */
import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";

export type OperationalGuidanceEntry = {
  summary: string;
  coordinatorHints: string[];
};

export const OPERATIONAL_GUIDANCE_REGISTRY: Record<
  OperationalRecommendationTrigger,
  OperationalGuidanceEntry
> = {
  coverage_low: {
    summary: "Priorizar confirmações e abrir plantões adicionais onde a política permitir.",
    coordinatorHints: [
      "Revisar plantões sem confirmação nas próximas 24–72h.",
      "Considerar abertura de plantões extras ou convites diretos a profissionais elegíveis.",
    ],
  },
  rising_risk: {
    summary: "Elevar ritmo de checagem dos indicadores-chave até o risco estabilizar.",
    coordinatorHints: [
      "Revisar painel de scoring e alertas a cada ciclo de coordenação.",
      "Documentar hipóteses de causa (cobertura vs. coordenação vs. força de trabalho).",
    ],
  },
  predicted_deterioration: {
    summary: "Tratar sinais de tendência como janela de intervenção preventiva.",
    coordinatorHints: [
      "Cruzar forecast baseline com KPIs do período para validar direção da tendência.",
      "Planejar mitigação antes que alertas críticos se multipliquem.",
    ],
  },
  operational_pressure: {
    summary: "Reduzir simultaneidade de gargalos (pendências, swaps, proximidade de início).",
    coordinatorHints: [
      "Priorizar decisões que liberem filas (swaps, confirmações, assignments).",
      "Redistribuir ownership de revisões entre coordenadores quando possível.",
    ],
  },
  critical_swaps: {
    summary: "Swaps próximos no tempo exigem decisão explícita e comunicação clara.",
    coordinatorHints: [
      "Processar swaps no horizonte crítico antes de outras filas informativas.",
      "Registrar justificativa curta em auditoria quando aplicável.",
    ],
  },
  rising_unavailability: {
    summary: "Fragilidade de disponibilidade ativa — reforçar plano B operacional.",
    coordinatorHints: [
      "Mapear profissionais sem janela ativa e campanhas de atualização de disponibilidade.",
      "Aumentar redundância de profissionais por turno sensível.",
    ],
  },
  pending_assignments: {
    summary: "Assignments pendentes acumulam risco de coordenação e cobertura.",
    coordinatorHints: [
      "Triar pendentes por proximidade de início e impacto em cobertura.",
      "Redistribuir revisões para evitar fila única.",
    ],
  },
  operational_conflicts: {
    summary: "Conflitos sinalizados pedem reconciliação manual antes de escalar cobertura.",
    coordinatorHints: [
      "Abrir plantões em conflito e resolver pendências múltiplas no mesmo slot.",
      "Evitar novas atribuições até o conflito estar classificado.",
    ],
  },
};
