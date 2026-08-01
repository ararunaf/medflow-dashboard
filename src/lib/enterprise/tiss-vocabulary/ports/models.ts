/**
 * Modelos canônicos do TISS Vocabulary — EPC-20.
 *
 * Representam somente conceitos semânticos permanentes.
 * NÃO representam arquivos XML, layouts, versões TISS, campos ANS,
 * operadoras, parsers, validações, regras, OCR, IA ou Workflow.
 *
 * Versões futuras da TISS serão adaptadas a este vocabulário
 * através da camada TISS Mapping (fora do escopo desta sprint).
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Metadata Engine. */
export type TISSMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type TISSConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Status / Tags
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural genérico — sem semântica de negócio. */
export type TISSConceptStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "unknown"
  | (string & {});

/** Tag genérica — classificação livre. */
export type TISSConceptTag = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Categorias semânticas (FASE 7) — conceitos de negócio, NÃO campos XML
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria semântica canônica do Vocabulário TISS.
 * Representa um conceito de negócio — nunca um elemento/layout XML.
 */
export type TISSConceptCategory =
  | "patient"
  | "beneficiary"
  | "professional"
  | "provider"
  | "organization"
  | "procedure"
  | "diagnosis"
  | "authorization"
  | "attendance"
  | "guide"
  | "claim"
  | "audit"
  | "payment"
  | "attachment"
  | "observation"
  | "relationship";

/** Catálogo estático das categorias semânticas (sem lógica). */
export const TISS_CONCEPT_CATEGORIES: readonly TISSConceptCategory[] = [
  "patient",
  "beneficiary",
  "professional",
  "provider",
  "organization",
  "procedure",
  "diagnosis",
  "authorization",
  "attendance",
  "guide",
  "claim",
  "audit",
  "payment",
  "attachment",
  "observation",
  "relationship",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
 * TISSConcept — modelo canônico (FASE 6)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Conceito canônico do Vocabulário TISS.
 *
 * Campos mínimos estruturais. Sem lógica. Sem vínculo a layout XML.
 */
export type TISSConcept = {
  /** ConceptId — identificador estável do conceito. */
  id: string;
  /** ConceptCode — código canônico opaco (não é tag XML). */
  conceptCode: string;
  /** CanonicalName — nome semântico permanente. */
  canonicalName: string;
  /** Description — descrição livre opcional. */
  description?: string;
  /** Category — categoria semântica de negócio. */
  category: TISSConceptCategory;
  /** Status estrutural. */
  status?: TISSConceptStatus;
  /** Version — versão do conceito no catálogo (não versão XML TISS). */
  version?: string;
  /** MetadataReference — referência opaca. */
  metadataReference?: TISSMetadataReference;
  /** ConfigurationReference — referência opaca. */
  configurationReference?: TISSConfigurationReference;
  /** Tags livres. */
  tags?: readonly TISSConceptTag[];
  /** CustomAttributes — extensão estrutural sem semântica fixa. */
  customAttributes?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Catálogo de fundação — um conceito representativo por categoria.
 * Somente definições semânticas. Sem campos XML. Sem validação.
 */
export const TISS_FOUNDATION_CONCEPTS: readonly Omit<TISSConcept, "createdAt" | "updatedAt">[] = [
  {
    id: "tiss-concept-patient",
    conceptCode: "TISS.PATIENT",
    canonicalName: "Patient",
    description: "Pessoa física objeto do cuidado de saúde.",
    category: "patient",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-beneficiary",
    conceptCode: "TISS.BENEFICIARY",
    canonicalName: "Beneficiary",
    description: "Beneficiário de plano de saúde suplementar (conceito universal).",
    category: "beneficiary",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-professional",
    conceptCode: "TISS.PROFESSIONAL",
    canonicalName: "Professional",
    description: "Profissional de saúde envolvido no atendimento.",
    category: "professional",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-provider",
    conceptCode: "TISS.PROVIDER",
    canonicalName: "Provider",
    description: "Prestador de serviço de saúde (conceito universal).",
    category: "provider",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-organization",
    conceptCode: "TISS.ORGANIZATION",
    canonicalName: "Organization",
    description: "Organização de saúde (sem operadora específica).",
    category: "organization",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-procedure",
    conceptCode: "TISS.PROCEDURE",
    canonicalName: "Procedure",
    description: "Procedimento clínico ou diagnóstico (código opaco).",
    category: "procedure",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-diagnosis",
    conceptCode: "TISS.DIAGNOSIS",
    canonicalName: "Diagnosis",
    description: "Diagnóstico associado ao atendimento (código opaco).",
    category: "diagnosis",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-authorization",
    conceptCode: "TISS.AUTHORIZATION",
    canonicalName: "Authorization",
    description: "Autorização prévia ou senha de autorização.",
    category: "authorization",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-attendance",
    conceptCode: "TISS.ATTENDANCE",
    canonicalName: "Attendance",
    description: "Atendimento ou episódio de cuidado.",
    category: "attendance",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-guide",
    conceptCode: "TISS.GUIDE",
    canonicalName: "Guide",
    description: "Guia de faturamento (conceito semântico — não layout XML).",
    category: "guide",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-claim",
    conceptCode: "TISS.CLAIM",
    canonicalName: "Claim",
    description: "Solicitação / cobrança associada a guia ou lote.",
    category: "claim",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-audit",
    conceptCode: "TISS.AUDIT",
    canonicalName: "Audit",
    description: "Artefato de auditoria estrutural (sem decisão automática).",
    category: "audit",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-payment",
    conceptCode: "TISS.PAYMENT",
    canonicalName: "Payment",
    description: "Pagamento ou liquidação associada a claim.",
    category: "payment",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-attachment",
    conceptCode: "TISS.ATTACHMENT",
    canonicalName: "Attachment",
    description: "Anexo ou evidência documental associada.",
    category: "attachment",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-observation",
    conceptCode: "TISS.OBSERVATION",
    canonicalName: "Observation",
    description: "Observação ou nota estrutural associada a um conceito.",
    category: "observation",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
  {
    id: "tiss-concept-relationship",
    conceptCode: "TISS.RELATIONSHIP",
    canonicalName: "Relationship",
    description: "Relacionamento semântico entre conceitos do vocabulário.",
    category: "relationship",
    status: "active",
    version: "1",
    tags: ["foundation", "semantic"],
  },
] as const;
