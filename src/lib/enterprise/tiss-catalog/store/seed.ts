/**
 * Seed mínimo do Enterprise TISS Canonical Catalog (TISS-02).
 *
 * Apenas exemplos estruturais. Catálogo completo será carregado por configuração.
 * Sem códigos de operadora. Sem regras. Sem XML.
 */
import type {
  CanonicalTISSDomain,
  CanonicalTISSGuideType,
  CanonicalTISSMetadata,
  CanonicalTISSProcedureGroup,
  CanonicalTISSProcedureType,
  CanonicalTISSProfile,
  CanonicalTISSReference,
  CanonicalTISSVersion,
  CanonicalTISSVocabularyEntry,
} from "../ports/canonical";

export const DEFAULT_TISS_CATALOG_ID = "enterprise-tiss-canonical-catalog";

export const MINIMAL_TISS_CATALOG_VERSIONS: readonly CanonicalTISSVersion[] = [
  {
    kind: "canonical-tiss-version",
    entryKind: "version",
    id: "ver-tiss-40100",
    code: "tiss-4.01.00",
    name: "TISS 4.01.00",
    description: "Exemplo mínimo de versão TISS (estrutural).",
    status: "active",
    versionLabel: "4.01.00",
    tags: ["version", "example"],
  },
  {
    kind: "canonical-tiss-version",
    entryKind: "version",
    id: "ver-tiss-30500",
    code: "tiss-3.05.00",
    name: "TISS 3.05.00",
    description: "Exemplo mínimo de versão TISS legada (estrutural).",
    status: "inactive",
    versionLabel: "3.05.00",
    tags: ["version", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_GUIDE_TYPES: readonly CanonicalTISSGuideType[] = [
  {
    kind: "canonical-tiss-guide-type",
    entryKind: "guide-type",
    id: "guide-consulta",
    code: "guia-consulta",
    name: "Guia de Consulta",
    description: "Exemplo mínimo de tipo de guia.",
    status: "active",
    category: "ambulatorial",
    domainCode: "domain-ambulatorial",
    tags: ["guide-type", "example"],
  },
  {
    kind: "canonical-tiss-guide-type",
    entryKind: "guide-type",
    id: "guide-sadt",
    code: "guia-sadt",
    name: "Guia SP/SADT",
    description: "Exemplo mínimo de tipo de guia SADT.",
    status: "active",
    category: "diagnostico",
    domainCode: "domain-ambulatorial",
    tags: ["guide-type", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_DOMAINS: readonly CanonicalTISSDomain[] = [
  {
    kind: "canonical-tiss-domain",
    entryKind: "domain",
    id: "dom-ambulatorial",
    code: "domain-ambulatorial",
    name: "Ambulatorial",
    description: "Domínio estrutural exemplo.",
    status: "active",
    category: "care",
    tags: ["domain", "example"],
  },
  {
    kind: "canonical-tiss-domain",
    entryKind: "domain",
    id: "dom-hospitalar",
    code: "domain-hospitalar",
    name: "Hospitalar",
    description: "Domínio estrutural exemplo.",
    status: "active",
    category: "care",
    tags: ["domain", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_PROCEDURE_GROUPS: readonly CanonicalTISSProcedureGroup[] = [
  {
    kind: "canonical-tiss-procedure-group",
    entryKind: "procedure-group",
    id: "pgroup-consulta",
    code: "group-consulta",
    name: "Grupo Consulta",
    description: "Exemplo mínimo de grupo de procedimento.",
    status: "active",
    category: "consulta",
    tags: ["procedure-group", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_PROCEDURE_TYPES: readonly CanonicalTISSProcedureType[] = [
  {
    kind: "canonical-tiss-procedure-type",
    entryKind: "procedure-type",
    id: "ptype-generico",
    code: "procedure-generic",
    name: "Procedimento Genérico",
    description: "Exemplo mínimo de tipo de procedimento.",
    status: "active",
    groupCode: "group-consulta",
    category: "consulta",
    tags: ["procedure-type", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_PROFILES: readonly CanonicalTISSProfile[] = [
  {
    kind: "canonical-tiss-catalog-profile",
    entryKind: "profile",
    id: "profile-structural-default",
    code: "profile-structural-default",
    name: "Perfil Estrutural Default",
    description: "Perfil canônico mínimo — sem regras de negócio.",
    status: "active",
    domainCode: "domain-ambulatorial",
    guideTypeCode: "guia-consulta",
    versionCode: "tiss-4.01.00",
    tags: ["profile", "example"],
  },
];

export const MINIMAL_TISS_CATALOG_VOCABULARY: readonly CanonicalTISSVocabularyEntry[] = [
  {
    kind: "canonical-tiss-vocabulary-entry",
    entryKind: "vocabulary-entry",
    id: "vocab-patient-name",
    code: "vocab.patient.name",
    name: "Nome do Paciente",
    description: "Entrada mínima de vocabulário (estrutura).",
    status: "active",
    category: "patient",
    domainCode: "domain-ambulatorial",
    conceptCode: "patient.name",
    tags: ["vocabulary", "example", "category"],
  },
  {
    kind: "canonical-tiss-vocabulary-entry",
    entryKind: "vocabulary-entry",
    id: "vocab-procedure-code",
    code: "vocab.procedure.code",
    name: "Código do Procedimento",
    description: "Entrada mínima de vocabulário (estrutura).",
    status: "active",
    category: "procedure",
    domainCode: "domain-ambulatorial",
    conceptCode: "procedure.code",
    tags: ["vocabulary", "example", "category"],
  },
];

export const MINIMAL_TISS_CATALOG_REFERENCES: readonly CanonicalTISSReference[] = [
  {
    kind: "canonical-tiss-reference",
    entryKind: "reference",
    id: "ref-guide-domain",
    referenceType: "guide-type-to-domain",
    sourceKind: "guide-type",
    sourceCode: "guia-consulta",
    targetKind: "domain",
    targetCode: "domain-ambulatorial",
    description: "Referência estrutural exemplo.",
  },
];

export const MINIMAL_TISS_CATALOG_METADATA: CanonicalTISSMetadata = {
  kind: "canonical-tiss-catalog-metadata",
  entryKind: "metadata",
  catalogId: DEFAULT_TISS_CATALOG_ID,
  namespace: "enterprise.tiss.catalog",
  channel: "foundation",
  tags: ["canonical", "tiss-02", "minimal-seed"],
  customAttributes: {
    seedLevel: "minimal",
    completeCatalogLoaded: false,
  },
};
