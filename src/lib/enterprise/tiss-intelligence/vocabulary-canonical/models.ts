/**
 * Modelos canônicos do Vocabulário TISS — EPC-20B.
 *
 * Estruturas imutáveis (readonly) que representam semanticamente o domínio TISS.
 * Não há carregamento, parser, armazenamento, inferência, mapeamento ou integração.
 */

export class TissVocabularyValue {
  constructor(
    readonly code: string,
    readonly label: string,
    readonly description: string,
    readonly effectiveFrom: string,
    readonly effectiveTo: string | null,
  ) {}
}

export class TissVocabularyField {
  constructor(
    readonly fieldId: string,
    readonly name: string,
    readonly dataType: string,
    readonly cardinality: string,
    readonly values: readonly TissVocabularyValue[],
  ) {}
}

export class TissVocabularyEntity {
  constructor(
    readonly entityId: string,
    readonly name: string,
    readonly fields: readonly TissVocabularyField[],
  ) {}
}

export class TissVocabularyGroup {
  constructor(
    readonly groupId: string,
    readonly name: string,
    readonly entities: readonly TissVocabularyEntity[],
  ) {}
}

export class TissVocabularyCategory {
  constructor(
    readonly categoryId: string,
    readonly name: string,
    readonly groups: readonly TissVocabularyGroup[],
  ) {}
}

export class TissVocabularyDomain {
  constructor(
    readonly domainId: string,
    readonly name: string,
    readonly version: string,
    readonly categories: readonly TissVocabularyCategory[],
  ) {}
}
