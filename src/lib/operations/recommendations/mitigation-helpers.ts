import type { OperationalRecommendationTrigger } from "@/lib/operations/recommendations/types";

/** Passos genéricos de mitigação por gatilho (determinísticos, não executáveis). */
export function buildMitigationPlanForTrigger(trigger: OperationalRecommendationTrigger): string[] {
  switch (trigger) {
    case "coverage_low":
      return [
        "Confirmar plantões críticos primeiro.",
        "Avaliar abertura de plantões extras na mesma unidade/turno.",
        "Comunicar risco de cobertura ao time de escala.",
      ];
    case "predicted_deterioration":
      return [
        "Validar forecast baseline com dados do período.",
        "Definir um owner para o plano de mitigação nas próximas 24h.",
        "Registrar decisões e follow-ups no timeline operacional.",
      ];
    case "operational_pressure":
      return [
        "Listar top 5 pendências por impacto e prazo.",
        "Emparelhar revisões de swaps com confirmações próximas.",
        "Reduzir novas solicitações não essenciais até estabilizar filas.",
      ];
    case "critical_swaps":
      return [
        "Ordenar swaps críticos por horário de início.",
        "Obter segunda opinião quando houver troca em janela sensível.",
        "Atualizar escalas imediatamente após aprovação/rejeição.",
      ];
    case "rising_unavailability":
      return [
        "Campanha de atualização de disponibilidade para profissionais inativos.",
        "Rever mix de backup por especialidade/turno.",
      ];
    case "pending_assignments":
      return [
        "Triagem por data de início do plantão.",
        "Resolver duplicidades antes de novas atribuições.",
      ];
    case "operational_conflicts":
      return [
        "Isolar plantões com múltiplas pendências.",
        "Resolver conflito antes de novas alocações.",
      ];
    case "rising_risk":
      return [
        "Checklist rápido: cobertura, swaps, pendentes, conflitos.",
        "Agendar checkpoint de coordenação se o risco permanecer alto.",
      ];
    default:
      return [];
  }
}
