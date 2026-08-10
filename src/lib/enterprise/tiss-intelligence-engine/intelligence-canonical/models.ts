/**
 * Modelos canônicos estruturais da Fase 6 (TISS Intelligence).
 *
 * Representam contratos semânticos de decisão. Não contêm lógica,
 * validação, algoritmo, persistência ou comportamento.
 */

export class TissIntelligenceContext {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
    readonly decisionDomainId: string,
  ) {}
}

export class TissDecisionScenario {
  constructor(
    readonly id: string,
    readonly contextId: string,
    readonly name: string,
    readonly objective: string,
  ) {}
}

export class TissDecisionCriterion {
  constructor(
    readonly id: string,
    readonly scenarioId: string,
    readonly name: string,
    readonly weight: number,
  ) {}
}

export class TissRecommendationProfile {
  constructor(
    readonly id: string,
    readonly scenarioId: string,
    readonly name: string,
    readonly targetAudience: string,
  ) {}
}

export class TissEvidenceReference {
  constructor(
    readonly id: string,
    readonly criterionId: string,
    readonly source: string,
    readonly reference: string,
  ) {}
}

export class TissDecisionDomain {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
  ) {}
}
