/**
 * Modelos canônicos do Mapeamento TISS — EPC-21B.
 *
 * Estruturas imutáveis (readonly) que representam as relações entre conceitos TISS.
 * Não há carregamento, parser, armazenamento, inferência, mapeamento funcional,
 * integração, consulta, cache ou persistência.
 */

export class TissMappingRule {
  constructor(
    readonly ruleId: string,
    readonly name: string,
    readonly sourceDomain: string,
    readonly targetDomain: string,
    readonly relationType: string,
    readonly version: string,
    readonly effectiveFrom: string,
    readonly effectiveTo: string | null,
  ) {}
}

export class TissMappingRelation {
  constructor(
    readonly relationId: string,
    readonly name: string,
    readonly description: string,
    readonly cardinality: string,
  ) {}
}

export class TissMappingTarget {
  constructor(
    readonly targetId: string,
    readonly code: string,
    readonly label: string,
    readonly domain: string,
  ) {}
}

export class TissMappingSource {
  constructor(
    readonly sourceId: string,
    readonly code: string,
    readonly label: string,
    readonly domain: string,
  ) {}
}

export class TissMappingContext {
  constructor(
    readonly contextId: string,
    readonly name: string,
    readonly applicableVersion: string,
    readonly owner: string,
  ) {}
}

export class TissMappingDomain {
  constructor(
    readonly domainId: string,
    readonly name: string,
    readonly version: string,
    readonly rules: readonly TissMappingRule[],
  ) {}
}
