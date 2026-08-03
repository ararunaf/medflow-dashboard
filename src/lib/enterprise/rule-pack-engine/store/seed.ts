/**
 * Seed do Enterprise Rule Pack Engine (TISS-03 / TISS-03A).
 *
 * - Foundation estrutural (TISS-03) — default da Runtime
 * - Enterprise Base Rule Packs (TISS-03A) — referência canônica
 *
 * Sem regras de operadora, contrato, tenant, clínica ou ANS.
 * Referências de catálogo são códigos opacos (resolvidos via TISSCatalogPort).
 */
import type { CanonicalRulePack } from "../ports/canonical";
import { ENTERPRISE_BASE_RULE_PACKS } from "./base-rule-packs";

export const DEFAULT_STRUCTURAL_RULE_PACK_CODE = "structural-foundation-pack";

/**
 * Pack estrutural mínimo — default da Runtime (primeiro ativo).
 * Demonstra interpretação via catálogo; permanece como pack de fundação.
 */
export const STRUCTURAL_FOUNDATION_RULE_PACK: CanonicalRulePack = {
  kind: "canonical-rule-pack",
  packId: "pack-structural-foundation",
  code: DEFAULT_STRUCTURAL_RULE_PACK_CODE,
  name: "Structural Foundation Pack",
  description:
    "Pack estrutural de fundação do Rule Pack Engine (TISS-03/03A). Sem regras de negócio.",
  status: "active",
  version: "1.1.0",
  priority: 1000,
  categories: ["structural", "foundation", "base"],
  tags: ["structural", "foundation", "tiss-03", "tiss-03a", "base"],
  catalogProfileCodes: ["profile-structural-default"],
  catalogDomainCodes: ["domain-ambulatorial"],
  compatibleTissVersionCodes: ["tiss-4.01.00", "tiss-3.05.00"],
  metadata: {
    kind: "canonical-rule-pack-metadata",
    namespace: "enterprise.tiss.rule-packs.base",
    channel: "foundation",
    source: "tiss-03a",
    tags: ["structural", "foundation"],
    customAttributes: { packSet: "enterprise-base", knowledgeSource: "TISSCatalogPort" },
  },
  expectedResult: {
    kind: "canonical-rule-pack-expected-result",
    minRulesMatched: 2,
    minFindings: 2,
    status: "completed",
    expectedAttributeKeys: ["structuralEngineExecuted"],
  },
  customAttributes: {
    generic: true,
    operatorSpecific: false,
    contractSpecific: false,
    tenantSpecific: false,
  },
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
};

/**
 * @deprecated Prefer ENTERPRISE_BASE_RULE_PACKS + STRUCTURAL_FOUNDATION_RULE_PACK.
 * Mantido para compatibilidade com consumidores TISS-03.
 */
export const MINIMAL_STRUCTURAL_RULE_PACKS: readonly CanonicalRulePack[] = [
  STRUCTURAL_FOUNDATION_RULE_PACK,
];

/**
 * Seed completo oficial: foundation (default Runtime) + Base Rule Packs (TISS-03A).
 * Foundation permanece primeiro para preservar o default da Runtime.
 */
export const ALL_SEEDED_RULE_PACKS: readonly CanonicalRulePack[] = [
  STRUCTURAL_FOUNDATION_RULE_PACK,
  ...ENTERPRISE_BASE_RULE_PACKS,
];

export {
  ENTERPRISE_BASE_RULE_PACKS,
  ENTERPRISE_BASE_RULE_PACK_COUNT,
  BASE_DOMAIN_EXISTENCE_PACK_CODE,
  BASE_GUIDE_TYPE_EXISTENCE_PACK_CODE,
  BASE_CATEGORY_EXISTENCE_PACK_CODE,
  BASE_CANONICAL_COMPATIBILITY_PACK_CODE,
  BASE_METADATA_PRESENCE_PACK_CODE,
  BASE_STRUCTURAL_CONSISTENCY_PACK_CODE,
  BASE_MULTI_VERSION_COMPATIBILITY_PACK_CODE,
} from "./base-rule-packs";
