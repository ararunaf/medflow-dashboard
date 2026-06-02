import type { OperationalReadinessSummary, StrategicStressProjection } from "./types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function stressToReadiness(score: number): number {
  return clamp01(1 - score);
}

/**
 * Agrega dimensões de readiness a partir das projeções de stress (inverso normalizado).
 */
export function buildOperationalReadinessSummary(input: {
  stressProjections: StrategicStressProjection[];
  orchestrationSaturationScore: number;
  governanceReadinessScore: number;
}): OperationalReadinessSummary {
  const byCode = new Map(input.stressProjections.map((s) => [s.code, s]));
  const staffing = byCode.get("staffing_demand");
  const escalation = byCode.get("escalation_pressure");
  const mitigation = byCode.get("mitigation_demand");
  const coordination = byCode.get("coordination_overload");
  const orchStress = byCode.get("orchestration_saturation");
  const opStress = byCode.get("operational_stress");

  const dimensions = [
    {
      code: "staffing",
      label: "Readiness de escalação de pessoas",
      score: staffing ? stressToReadiness(staffing.score) : 0.75,
      note: staffing?.rationale[0] ?? "Sem sinal forte de staffing neste recorte.",
    },
    {
      code: "escalation",
      label: "Prontidão para escalonamento",
      score: escalation ? stressToReadiness(escalation.score) : 0.75,
      note: escalation?.rationale[0] ?? "Pressão de escalonamento moderada.",
    },
    {
      code: "orchestration",
      label: "Capacidade de orquestração",
      score: stressToReadiness(orchStress?.score ?? input.orchestrationSaturationScore),
      note: orchStress?.rationale[0] ?? "Saturação inferida a partir de filas ativas.",
    },
    {
      code: "mitigation",
      label: "Preparação de mitigação",
      score: mitigation ? stressToReadiness(mitigation.score) : 0.7,
      note: mitigation?.rationale[0] ?? "Demanda de mitigação dentro do esperado.",
    },
    {
      code: "coordination",
      label: "Coordenação",
      score: coordination ? stressToReadiness(coordination.score) : 0.72,
      note: coordination?.rationale[0] ?? "Carga de coordenação estável.",
    },
    {
      code: "governance",
      label: "Governança / política",
      score: clamp01(input.governanceReadinessScore),
      note: "Digest de policy intelligence e limites de planejamento.",
    },
  ];

  const parts = dimensions.map((d) => d.score);
  const overallScore = clamp01(parts.reduce((a, b) => a + b, 0) / parts.length);
  const op =
    opStress?.level === "high"
      ? "atenção elevada"
      : opStress?.level === "moderate"
        ? "atenção distribuída"
        : "operacionalmente estável";
  const headline = `Readiness consolidado ${(overallScore * 100).toFixed(0)}% — ${op}.`;

  return { overallScore, headline, dimensions };
}
