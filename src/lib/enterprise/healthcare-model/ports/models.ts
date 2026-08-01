/**
 * Modelos canônicos universais de saúde — EPC-19.
 *
 * Representam somente conceitos abstratos de saúde suplementar.
 * NÃO conhecem TISS, TUSS, CID, ANS, operadoras, cooperativas,
 * prestadores específicos, XML, OCR, IA, Workflow ou Rule Engine.
 *
 * Todos os modelos compartilham a base estrutural (FASE 7).
 * Sem qualquer lógica.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Metadata Engine. */
export type HealthcareMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type HealthcareConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Base estrutural obrigatória (FASE 7)
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural genérico — sem semântica de negócio. */
export type HealthcareEntityStatus =
  | "draft"
  | "active"
  | "inactive"
  | "archived"
  | "unknown"
  | (string & {});

/** Tag genérica — classificação livre. */
export type HealthcareTag = string;

/** Kind canônico de entidade (discriminador estrutural). */
export type HealthcareEntityKind =
  | "document"
  | "organization"
  | "professional"
  | "patient"
  | "beneficiary"
  | "procedure"
  | "diagnosis"
  | "authorization"
  | "attendance"
  | "episode"
  | "claim"
  | "audit"
  | "payment"
  | "attachment"
  | "evidence"
  | "reference";

/**
 * Base canônica compartilhada por todos os modelos.
 * Sem lógica. Sem campos de padrão de mercado.
 */
export type HealthcareEntityBase = {
  id: string;
  version?: string;
  status?: HealthcareEntityStatus;
  metadataReference?: HealthcareMetadataReference;
  configurationReference?: HealthcareConfigurationReference;
  tags?: readonly HealthcareTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Modelos canônicos (FASE 6) — abstratos / universais
 * ───────────────────────────────────────────────────────────────────────── */

/** Documento de saúde canônico (genérico — sem tipo de guia de mercado). */
export type HealthcareDocument = HealthcareEntityBase & {
  kind: "document";
  /** Rótulo livre / tipo abstrato. */
  documentType?: string;
  title?: string;
  description?: string;
};

/** Organização de saúde canônica (genérica — sem operadora/cooperativa). */
export type HealthcareOrganization = HealthcareEntityBase & {
  kind: "organization";
  name?: string;
  organizationType?: string;
  description?: string;
};

/** Profissional de saúde canônico. */
export type HealthcareProfessional = HealthcareEntityBase & {
  kind: "professional";
  name?: string;
  specialty?: string;
  professionalType?: string;
};

/** Paciente canônico. */
export type HealthcarePatient = HealthcareEntityBase & {
  kind: "patient";
  displayName?: string;
  birthDate?: string;
};

/** Beneficiário canônico (conceito universal — sem plano/operadora). */
export type HealthcareBeneficiary = HealthcareEntityBase & {
  kind: "beneficiary";
  displayName?: string;
  membershipCode?: string;
};

/** Procedimento canônico (código opaco — sem TUSS/CBHPM). */
export type HealthcareProcedure = HealthcareEntityBase & {
  kind: "procedure";
  code?: string;
  description?: string;
  quantity?: number;
};

/** Diagnóstico canônico (código opaco — sem CID). */
export type HealthcareDiagnosis = HealthcareEntityBase & {
  kind: "diagnosis";
  code?: string;
  description?: string;
};

/** Autorização canônica. */
export type HealthcareAuthorization = HealthcareEntityBase & {
  kind: "authorization";
  authorizationCode?: string;
  description?: string;
};

/** Atendimento canônico. */
export type HealthcareAttendance = HealthcareEntityBase & {
  kind: "attendance";
  attendanceType?: string;
  description?: string;
  occurredAt?: string;
};

/** Episódio de cuidado canônico. */
export type HealthcareEpisode = HealthcareEntityBase & {
  kind: "episode";
  episodeType?: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
};

/** Solicitação / claim canônico (conceito universal de cobrança). */
export type HealthcareClaim = HealthcareEntityBase & {
  kind: "claim";
  claimType?: string;
  description?: string;
  amount?: number;
  currency?: string;
};

/** Auditoria canônica (artefato estrutural — sem IA / decisão). */
export type HealthcareAudit = HealthcareEntityBase & {
  kind: "audit";
  auditType?: string;
  summary?: string;
};

/** Pagamento canônico. */
export type HealthcarePayment = HealthcareEntityBase & {
  kind: "payment";
  paymentType?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
};

/** Anexo canônico (referência estrutural — sem binário). */
export type HealthcareAttachment = HealthcareEntityBase & {
  kind: "attachment";
  name?: string;
  mimeType?: string;
  uri?: string;
};

/** Evidência canônica (opaca — sem interpretação clínica). */
export type HealthcareEvidence = HealthcareEntityBase & {
  kind: "evidence";
  evidenceType?: string;
  description?: string;
  source?: string;
};

/** Referência canônica genérica entre artefatos. */
export type HealthcareReference = HealthcareEntityBase & {
  kind: "reference";
  referenceType?: string;
  targetKind?: string;
  targetId?: string;
  description?: string;
};

/** União discriminada de todos os modelos canônicos. */
export type HealthcareEntity =
  | HealthcareDocument
  | HealthcareOrganization
  | HealthcareProfessional
  | HealthcarePatient
  | HealthcareBeneficiary
  | HealthcareProcedure
  | HealthcareDiagnosis
  | HealthcareAuthorization
  | HealthcareAttendance
  | HealthcareEpisode
  | HealthcareClaim
  | HealthcareAudit
  | HealthcarePayment
  | HealthcareAttachment
  | HealthcareEvidence
  | HealthcareReference;

/** Catálogo estático dos kinds canônicos (sem lógica). */
export const HEALTHCARE_ENTITY_KINDS: readonly HealthcareEntityKind[] = [
  "document",
  "organization",
  "professional",
  "patient",
  "beneficiary",
  "procedure",
  "diagnosis",
  "authorization",
  "attendance",
  "episode",
  "claim",
  "audit",
  "payment",
  "attachment",
  "evidence",
  "reference",
] as const;
