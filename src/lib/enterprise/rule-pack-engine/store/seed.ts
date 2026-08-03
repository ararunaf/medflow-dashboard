/**
 * Seed mínimo estrutural do Enterprise Rule Pack Engine (TISS-03).
 *
 * Apenas exemplos estruturais genéricos. Packs base reais: TISS-03A.
 * Sem regras de operadora, contrato, tenant, clínica ou ANS.
 * Referências de catálogo são códigos opacos (resolvidos via TISSCatalogPort).
 */
import type { CanonicalRulePack } from "../ports/canonical";

export const DEFAULT_STRUCTURAL_RULE_PACK_CODE = "structural-foundation-pack";

/**
 * Pack estrutural mínimo — demonstra interpretação via catálogo.
 * Condições usam códigos opacos alinhados ao seed mínimo do TISS Catalog.
 */
export const MINIMAL_STRUCTURAL_RULE_PACKS: readonly CanonicalRulePack[] = [
  {
    kind: "canonical-rule-pack",
    packId: "pack-structural-foundation",
    code: DEFAULT_STRUCTURAL_RULE_PACK_CODE,
    name: "Structural Foundation Pack",
    description: "Exemplo mínimo estrutural do Rule Pack Engine (TISS-03). Sem regras de negócio.",
    status: "active",
    version: "1.0.0",
    catalogProfileCodes: ["profile-structural-default"],
    catalogDomainCodes: ["domain-ambulatorial"],
    tags: ["structural", "example", "tiss-03"],
    rules: [
      {
        kind: "canonical-rule",
        id: "rule-catalog-profile-exists",
        code: "STRUCT-PROFILE-EXISTS",
        name: "Catalog profile reference exists",
        description: "Condição estrutural: perfil do catálogo resolvido via TISSCatalogPort.",
        status: "enabled",
        priority: 100,
        severity: "info",
        catalogProfileCodes: ["profile-structural-default"],
        tags: ["structural", "catalog"],
        conditions: [
          {
            kind: "canonical-rule-condition",
            id: "cond-profile-exists",
            name: "Profile exists in catalog",
            conditionType: "catalog-entry-exists",
            catalogEntryKind: "profile",
            catalogCode: "profile-structural-default",
          },
        ],
        actions: [
          {
            kind: "canonical-rule-action",
            id: "act-emit-profile-ok",
            name: "Emit structural finding",
            actionType: "emit-finding",
            message: "Catalog profile reference resolved via TISSCatalogPort.",
            severity: "info",
          },
        ],
      },
      {
        kind: "canonical-rule",
        id: "rule-always-record",
        code: "STRUCT-ALWAYS",
        name: "Always record structural attribute",
        description: "Condição always — demonstra ação estrutural sem domínio.",
        status: "enabled",
        priority: 10,
        severity: "info",
        tags: ["structural"],
        conditions: [
          {
            kind: "canonical-rule-condition",
            id: "cond-always",
            name: "Always",
            conditionType: "always",
          },
        ],
        actions: [
          {
            kind: "canonical-rule-action",
            id: "act-record-attr",
            name: "Record structural attribute",
            actionType: "record-attribute",
            attributeKey: "structuralEngineExecuted",
            attributeValue: true,
            message: "Structural Rule Pack Engine executed.",
            severity: "info",
          },
        ],
      },
    ],
  },
];
