/**
 * Simuladores dry-run por tipo de ação operacional.
 *
 * Cada simulador é uma função pura: recebe a proposta + snapshot do command
 * center + entidades extraídas e retorna o conjunto de mutações projetadas,
 * entidades afetadas, deltas de score e conflitos potenciais.
 *
 * Nenhuma mutação real é executada. As estruturas geradas só alimentam a UI
 * de simulação e o audit trail.
 */
import type { OperationalActionKind } from "@/lib/database.types";
import type { OperationalActionProposalDto } from "@/lib/operations/action-proposals";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type { ExtractedPayloadEntityIds } from "@/lib/operations/execution-sandbox/simulation-validators";
import type {
  AffectedEntity,
  ProjectedConflict,
  ProjectedScoreChange,
  SimulatedMutation,
  SimulatedMutationDirection,
} from "@/lib/operations/execution-sandbox/types";

/** Output unificado de cada simulador. */
export type DryRunOutcome = {
  mutations: SimulatedMutation[];
  affectedEntities: AffectedEntity[];
  projectedScoreChanges: ProjectedScoreChange[];
  projectedConflicts: ProjectedConflict[];
  summaryBullets: string[];
  semanticTags: string[];
};

export type DryRunContext = {
  proposal: OperationalActionProposalDto;
  snapshot: OperationalCommandCenterSnapshot;
  ids: ExtractedPayloadEntityIds;
  maxAffectedEntities: number;
};

function makeMutationId(prefix: string, idx: number, ref: string): string {
  const suffix = ref.length > 8 ? ref.slice(0, 8) : ref || "noref";
  return `sim:${prefix}:${idx}:${suffix}`;
}

function shortLabelForShift(snapshot: OperationalCommandCenterSnapshot, shiftId: string): string {
  const match = snapshot.coordination.swapsCritical.find((s) => s.swapId === shiftId);
  if (match) return `Plantão ${match.departmentName}`;
  return `Plantão ${shiftId.slice(0, 8)}…`;
}

/* -------------------------------------------------------------------------- */
/*                          Simuladores específicos                            */
/* -------------------------------------------------------------------------- */

function simulateStaffingAdjustment(ctx: DryRunContext): DryRunOutcome {
  const { snapshot, ids } = ctx;
  const mutations: SimulatedMutation[] = [];
  const affected: AffectedEntity[] = [];
  const conflicts: ProjectedConflict[] = [];

  const targetShifts = ids.shiftIds.slice(0, ctx.maxAffectedEntities);
  targetShifts.forEach((shiftId, idx) => {
    mutations.push({
      id: makeMutationId("staffing", idx, shiftId),
      direction: "update" as SimulatedMutationDirection,
      targetTable: "shifts",
      describe: `Ajustar parâmetros operacionais (cobertura, papel, janela) do plantão ${shiftId.slice(
        0,
        8,
      )}… (somente projetado).`,
      projectedPatch: { hypothetical: true, ajuste_de_escala: true },
      referencesEntityIds: [shiftId],
    });
    affected.push({
      kind: "shift",
      id: shiftId,
      label: shortLabelForShift(snapshot, shiftId),
      impactSeverity: snapshot.indicators.coveragePercent < 65 ? "high" : "moderate",
      tags: ["staffing_adjustment", "coverage_uplift"],
    });
  });

  if (targetShifts.length === 0) {
    mutations.push({
      id: makeMutationId("staffing", 0, "global"),
      direction: "notify",
      targetTable: "operational_events",
      describe:
        "Sinalizar à coordenação que ajuste de escala foi proposto sem alvo explícito (revisão humana).",
      referencesEntityIds: [],
    });
  }

  const coverageDelta = snapshot.indicators.coveragePercent < 70 ? 6 : 3;
  const scoreChanges: ProjectedScoreChange[] = [
    {
      scoreId: "coverage_risk_score",
      projectedDeltaPoints: coverageDelta,
      confidence: "low",
      rationale:
        "Ajuste de escala tende a reduzir lacunas de cobertura — efeito conservador estimado.",
    },
    {
      scoreId: "workforce_stability_score",
      projectedDeltaPoints: 2,
      confidence: "low",
      rationale: "Alocação adicional fortalece confirmação na janela observada.",
    },
  ];

  if (snapshot.indicators.shiftsWithMultiplePending > 0) {
    conflicts.push({
      kind: "duplicate_pending",
      severity: "moderate",
      description:
        "Já existem plantões com múltiplas atribuições pendentes; cuidar para não duplicar.",
    });
  }

  return {
    mutations,
    affectedEntities: affected,
    projectedScoreChanges: scoreChanges,
    projectedConflicts: conflicts,
    summaryBullets: [
      `${targetShifts.length} plantão(ões) alvo no payload (${ids.shiftIds.length} ao todo).`,
      `Cobertura projetada melhora ~${coverageDelta} pontos no score de risco.`,
    ],
    semanticTags: ["staffing_simulation", "coverage_focus"],
  };
}

function simulateEscalation(ctx: DryRunContext): DryRunOutcome {
  const { proposal, ids, snapshot } = ctx;
  const mutations: SimulatedMutation[] = [
    {
      id: makeMutationId("escalation", 0, proposal.id),
      direction: "notify",
      targetTable: "operational_events",
      describe:
        "Registrar evento de escalação (coordenador / liderança) — projeção somente; sem disparo real.",
      referencesEntityIds: ids.shiftIds.slice(0, 4),
    },
  ];

  const affected: AffectedEntity[] = ids.shiftIds.slice(0, ctx.maxAffectedEntities).map((id) => ({
    kind: "shift" as const,
    id,
    label: shortLabelForShift(snapshot, id),
    impactSeverity: "moderate",
    tags: ["escalation_target"],
  }));

  const conflicts: ProjectedConflict[] = [];
  if (snapshot.coordination.urgency === "critica") {
    conflicts.push({
      kind: "policy_violation",
      severity: "high",
      description:
        "Urgência operacional já crítica — escalação adicional pode duplicar sinais; revisar narrativa.",
    });
  }

  return {
    mutations,
    affectedEntities: affected,
    projectedScoreChanges: [
      {
        scoreId: "coordination_stress_score",
        projectedDeltaPoints: -1.5,
        confidence: "low",
        rationale:
          "Escalação amplifica visibilidade — pode aumentar levemente a percepção de estresse antes de melhorar.",
      },
    ],
    projectedConflicts: conflicts,
    summaryBullets: [
      `Escalação simulada envolveria ${affected.length} plantão(ões).`,
      "Ação é principalmente comunicativa — sem mutação operacional direta.",
    ],
    semanticTags: ["escalation_simulation", "communication"],
  };
}

function simulateMitigation(ctx: DryRunContext): DryRunOutcome {
  const { ids, snapshot } = ctx;
  const targetShifts = ids.shiftIds.slice(0, ctx.maxAffectedEntities);
  const mutations: SimulatedMutation[] = targetShifts.map((shiftId, idx) => ({
    id: makeMutationId("mitigation", idx, shiftId),
    direction: "create",
    targetTable: "shift_assignments",
    describe: `Criar nova atribuição pendente para plantão ${shiftId.slice(
      0,
      8,
    )}… (apenas simulação).`,
    projectedPatch: { assignment_status: "pending", hypothetical: true },
    referencesEntityIds: [shiftId],
  }));

  // Se proposta listar professionals, também os marca como afetados
  const affectedShifts: AffectedEntity[] = targetShifts.map((id) => ({
    kind: "shift" as const,
    id,
    label: shortLabelForShift(snapshot, id),
    impactSeverity: "high",
    tags: ["mitigation_target", "coverage_uplift"],
  }));
  const affectedProfs: AffectedEntity[] = ids.professionalIds
    .slice(0, ctx.maxAffectedEntities)
    .map((id) => ({
      kind: "professional" as const,
      id,
      label: `Profissional ${id.slice(0, 8)}…`,
      impactSeverity: "moderate",
      tags: ["mitigation_candidate"],
    }));

  const conflicts: ProjectedConflict[] = [];
  if (snapshot.indicators.shiftsWithMultiplePending > 0 && targetShifts.length > 0) {
    conflicts.push({
      kind: "duplicate_pending",
      severity: "moderate",
      description: "Algum alvo pode já ter múltiplas atribuições pendentes — risco de duplicação.",
    });
  }

  const scoreChanges: ProjectedScoreChange[] = [
    {
      scoreId: "coverage_risk_score",
      projectedDeltaPoints: 8,
      confidence: "low",
      rationale: "Mitigação direta reduz risco de cobertura proporcional aos alvos.",
    },
    {
      scoreId: "coordination_stress_score",
      projectedDeltaPoints: 4,
      confidence: "low",
      rationale: "Reduz pressão pendente no curto prazo se as atribuições forem aceitas.",
    },
  ];

  return {
    mutations,
    affectedEntities: [...affectedShifts, ...affectedProfs],
    projectedScoreChanges: scoreChanges,
    projectedConflicts: conflicts,
    summaryBullets: [
      `${targetShifts.length} mitigação(ões) propostas — ${affectedProfs.length} profissional(is) candidato(s) referenciado(s).`,
      "Sem efeito real até aprovação humana e camada futura de execução.",
    ],
    semanticTags: ["mitigation_simulation", "coverage_critical"],
  };
}

function simulateCoordination(ctx: DryRunContext): DryRunOutcome {
  const { ids, snapshot } = ctx;
  const swapIds = ids.swapIds.slice(0, ctx.maxAffectedEntities);
  const mutations: SimulatedMutation[] = swapIds.map((swapId, idx) => ({
    id: makeMutationId("coordination", idx, swapId),
    direction: "update",
    targetTable: "shift_swap_requests",
    describe: `Coordenar fluxo do swap ${swapId.slice(0, 8)}… (apenas projeção).`,
    referencesEntityIds: [swapId],
  }));

  const affected: AffectedEntity[] = swapIds.map((id) => ({
    kind: "shift_swap_request" as const,
    id,
    label: `Swap ${id.slice(0, 8)}…`,
    impactSeverity: "moderate",
    tags: ["coordination_focus"],
  }));

  const conflicts: ProjectedConflict[] = [];
  if (snapshot.indicators.swapsAwaitingApproval >= 5 && swapIds.length === 0) {
    conflicts.push({
      kind: "missing_target",
      severity: "low",
      description:
        "Fila de swaps elevada, mas a proposta não traz IDs alvo no payload — coordenador deve refinar.",
    });
  }

  return {
    mutations,
    affectedEntities: affected,
    projectedScoreChanges: [
      {
        scoreId: "coordination_stress_score",
        projectedDeltaPoints: 5,
        confidence: "low",
        rationale: "Coordenação consolidada tende a reduzir o estresse percebido na fila.",
      },
    ],
    projectedConflicts: conflicts,
    summaryBullets: [
      `${swapIds.length} swap(s) simulado(s) para coordenação.`,
      "Ação prioriza fila — nenhum status real é alterado durante a simulação.",
    ],
    semanticTags: ["coordination_simulation", "swap_queue"],
  };
}

function simulateOperationalReview(ctx: DryRunContext): DryRunOutcome {
  const { snapshot, proposal } = ctx;
  const mutations: SimulatedMutation[] = [
    {
      id: makeMutationId("review", 0, proposal.id),
      direction: "notify",
      targetTable: "operational_events",
      describe:
        "Agendar revisão operacional formal — registro hipotético na timeline (apenas simulado).",
      referencesEntityIds: [],
    },
  ];

  return {
    mutations,
    affectedEntities: [],
    projectedScoreChanges: [
      {
        scoreId: "operational_health_score",
        projectedDeltaPoints: 1,
        confidence: "low",
        rationale: "Revisão operacional tende a reforçar disciplina sem impacto técnico direto.",
      },
    ],
    projectedConflicts: [],
    summaryBullets: [
      `Revisão operacional sobre snapshot ${new Date(snapshot.asOf).toLocaleTimeString("pt-BR")}.`,
      "Sem mutações em plantões — efeito predominantemente organizacional.",
    ],
    semanticTags: ["review_simulation", "governance"],
  };
}

function simulateAssignmentSuggestion(ctx: DryRunContext): DryRunOutcome {
  const { ids, snapshot } = ctx;
  const shiftIds = ids.shiftIds.slice(0, ctx.maxAffectedEntities);
  const profIds = ids.professionalIds.slice(0, ctx.maxAffectedEntities);

  const conflicts: ProjectedConflict[] = [];
  if (shiftIds.length === 0 || profIds.length === 0) {
    conflicts.push({
      kind: "missing_target",
      severity: "moderate",
      description:
        "Sugestão de atribuição precisa de pelo menos 1 shift + 1 profissional no payload.",
    });
  }

  const pairs = Math.min(shiftIds.length, profIds.length);
  const mutations: SimulatedMutation[] = [];
  for (let i = 0; i < pairs; i += 1) {
    mutations.push({
      id: makeMutationId("assignment", i, shiftIds[i]!),
      direction: "create",
      targetTable: "shift_assignments",
      describe: `Sugerir atribuição: plantão ${shiftIds[i]!.slice(
        0,
        8,
      )}… ↔ profissional ${profIds[i]!.slice(0, 8)}… (somente proposta).`,
      projectedPatch: {
        shift_id: shiftIds[i]!,
        professional_id: profIds[i]!,
        assignment_status: "pending",
        hypothetical: true,
      },
      referencesEntityIds: [shiftIds[i]!, profIds[i]!],
    });
  }

  const affected: AffectedEntity[] = [
    ...shiftIds.map((id) => ({
      kind: "shift" as const,
      id,
      label: shortLabelForShift(snapshot, id),
      impactSeverity: "moderate" as const,
      tags: ["assignment_suggestion"],
    })),
    ...profIds.map((id) => ({
      kind: "professional" as const,
      id,
      label: `Profissional ${id.slice(0, 8)}…`,
      impactSeverity: "low" as const,
      tags: ["assignment_candidate"],
    })),
  ];

  if (snapshot.indicators.shiftsWithMultiplePending > 0) {
    conflicts.push({
      kind: "duplicate_pending",
      severity: "low",
      description:
        "Atenção: já há plantões com múltiplas pendências; coordenar para não somar ruído.",
    });
  }

  return {
    mutations,
    affectedEntities: affected,
    projectedScoreChanges: [
      {
        scoreId: "coverage_risk_score",
        projectedDeltaPoints: 4,
        confidence: "low",
        rationale: "Atribuições sugeridas, se aceitas, reduzem ligeiramente o risco de cobertura.",
      },
      {
        scoreId: "workforce_stability_score",
        projectedDeltaPoints: 1.5,
        confidence: "low",
        rationale: "Pareamento bem feito ajuda na estabilidade da escala.",
      },
    ],
    projectedConflicts: conflicts,
    summaryBullets: [
      `${pairs} atribuição(ões) projetada(s).`,
      "Sandbox não cria nada — coordenação humana valida a sugestão.",
    ],
    semanticTags: ["assignment_simulation", "pairing"],
  };
}

/* -------------------------------------------------------------------------- */
/*                              Dispatcher                                     */
/* -------------------------------------------------------------------------- */

export function runDryRunForActionKind(ctx: DryRunContext): DryRunOutcome {
  const kind: OperationalActionKind = ctx.proposal.actionKind;
  switch (kind) {
    case "staffing_adjustment":
      return simulateStaffingAdjustment(ctx);
    case "escalation":
      return simulateEscalation(ctx);
    case "mitigation":
      return simulateMitigation(ctx);
    case "coordination":
      return simulateCoordination(ctx);
    case "operational_review":
      return simulateOperationalReview(ctx);
    case "assignment_suggestion":
      return simulateAssignmentSuggestion(ctx);
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return {
        mutations: [],
        affectedEntities: [],
        projectedScoreChanges: [],
        projectedConflicts: [
          {
            kind: "policy_violation",
            severity: "high",
            description: `Tipo de ação não suportado pelo sandbox: ${String(kind)}`,
          },
        ],
        summaryBullets: ["Tipo de ação não suportado pelo sandbox."],
        semanticTags: ["unsupported_action"],
      };
    }
  }
}
