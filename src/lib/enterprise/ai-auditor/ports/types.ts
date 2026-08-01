/**
 * Tipos vendor-agnósticos da AI Auditor Foundation — EPC-18.
 *
 * A AI Auditora NÃO toma decisões, NÃO aprova, NÃO reprova,
 * NÃO executa regras e NÃO interpreta contratos.
 *
 * Produz exclusivamente AuditExplanation.
 * Utiliza AI Orchestrator (EPC-16) → AI Provider Framework (EPC-07).
 * Nunca HTTP. Nunca prompts. Nunca IA real nesta sprint.
 *
 * Arquitetura obrigatória:
 *   Application → AIAuditorPort → Adapter → Store → Factory → Provider
 *     → AI Orchestrator → AI Provider Framework
 */
import type { AIProviderId } from "../../ai-provider";
import type { ConfidenceLevel } from "./confidence";

export type { AIProviderId };
export type { ConfidenceLevel };

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos da AI Auditora (extensível). */
export type AIAuditorProviderId = "default" | "mock" | "test";

/** Tag genérica — classificação livre. */
export type AuditTag = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Metadata Engine. */
export type AuditMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Configuration Engine. */
export type AuditConfigurationReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Document Processing. */
export type AuditProcessingReference = {
  id?: string;
  processingId?: string;
  kind?: string;
  version?: string;
};

/** Referência opaca a Workflow. */
export type AuditWorkflowReference = {
  id?: string;
  workflowId?: string;
  instanceId?: string;
  kind?: string;
  version?: string;
};

/** Referência opaca a Rule Pack. */
export type AuditRulePackReference = {
  id?: string;
  packId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Documento. */
export type AuditDocumentReference = {
  id?: string;
  documentId?: string;
  kind?: string;
  version?: string;
  uri?: string;
};

/** Referência opaca a Contrato. */
export type AuditContractReference = {
  id?: string;
  contractId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Referência opaca a Regra (sem execução). */
export type AuditRelatedRuleReference = {
  id?: string;
  ruleId?: string;
  name?: string;
  version?: string;
  kind?: string;
};

/** Evidência estrutural opaca (sem interpretação clínica). */
export type AuditEvidence = {
  id?: string;
  kind?: string;
  description?: string;
  source?: string;
  reference?: string;
  attributes?: Readonly<Record<string, unknown>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AuditFinding (FASE 7) — modelo canônico, sem lógica
 * ───────────────────────────────────────────────────────────────────────── */

/** Severidade estrutural do finding (sem decisão de negócio). */
export type AuditFindingSeverity = "info" | "low" | "medium" | "high" | "critical" | (string & {});

/** Categoria estrutural do finding (rótulo livre). */
export type AuditFindingCategory = string;

/**
 * Finding canônico da explicação.
 * Sem lógica. Sem aprovação. Sem reprovação.
 */
export type AuditFinding = {
  findingId: string;
  category?: AuditFindingCategory;
  severity?: AuditFindingSeverity;
  description?: string;
  evidence?: readonly AuditEvidence[];
  relatedRule?: AuditRelatedRuleReference;
  confidence?: ConfidenceLevel;
  reference?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AuditExplanation (FASE 6) — modelo canônico
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Explicação canônica produzida pela AI Auditora.
 *
 * Único artefato consumível pelo restante do MedicFlow.
 * Independente do modelo de IA / vendor.
 * Preparado para versionamento e auditoria futura.
 */
export type AuditExplanation = {
  auditId: string;
  summary: string;
  evidenceList?: readonly AuditEvidence[];
  relatedRules?: readonly AuditRelatedRuleReference[];
  referencedContracts?: readonly AuditContractReference[];
  confidenceLevel: ConfidenceLevel;
  findings?: readonly AuditFinding[];
  recommendations?: readonly string[];
  warnings?: readonly string[];
  metadataReference?: AuditMetadataReference;
  configurationReference?: AuditConfigurationReference;
  processingReference?: AuditProcessingReference;
  workflowReference?: AuditWorkflowReference;
  rulePackReference?: AuditRulePackReference;
  documentReference?: AuditDocumentReference;
  timestamp: string;
  tags?: readonly AuditTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
  /** Versão estrutural do modelo de explicação (prep versionamento). */
  explanationVersion?: string;
  /** Provider de IA selecionado via Orchestrator (opaco — sem invoke). */
  selectedAiProvider?: AIProviderId;
  /** Indica explicação determinística de fundação (nunca LLM). */
  simulated?: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AuditRequest / AuditResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado determinístico opaco (eco do Rule Engine).
 * A AI Auditora NÃO interpreta nem reavalia este payload.
 */
export type DeterministicAuditOutcome = {
  code?: string;
  summary?: string;
  status?: string;
  findings?: readonly AuditFinding[];
  evidenceList?: readonly AuditEvidence[];
  relatedRules?: readonly AuditRelatedRuleReference[];
  referencedContracts?: readonly AuditContractReference[];
  recommendations?: readonly string[];
  warnings?: readonly string[];
  attributes?: Readonly<Record<string, unknown>>;
};

/**
 * Solicitação canônica de auditoria explicativa.
 * Não contém prompts. Não contém decisões.
 */
export type AuditRequest = {
  auditId?: string;
  deterministicOutcome?: DeterministicAuditOutcome;
  relatedRules?: readonly AuditRelatedRuleReference[];
  referencedContracts?: readonly AuditContractReference[];
  metadataReference?: AuditMetadataReference;
  configurationReference?: AuditConfigurationReference;
  processingReference?: AuditProcessingReference;
  workflowReference?: AuditWorkflowReference;
  rulePackReference?: AuditRulePackReference;
  documentReference?: AuditDocumentReference;
  /** Preferências repassadas ao AI Orchestrator (seleção apenas). */
  preferredProviders?: readonly AIProviderId[];
  fallbackProviders?: readonly AIProviderId[];
  tags?: readonly AuditTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};

/**
 * Resultado operacional do Port.
 * Consumidores de produto devem usar exclusivamente `explanation`.
 */
export type AuditResult = {
  ok: boolean;
  explanation?: AuditExplanation;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / ProviderInfo / Configuration
 * ───────────────────────────────────────────────────────────────────────── */

export type AIAuditorHealth = {
  ok: boolean;
  provider: AIAuditorProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de explicações no store. */
  storedExplanationCount?: number;
  /** Saúde do AI Orchestrator (EPC-16). */
  orchestratorOk?: boolean;
};

/**
 * Capacidades do AIAuditorPort (adapter-level).
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type AIAuditorCapabilities = {
  provider: AIAuditorProviderId;
  adapterId: string;
  supportsAudit: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderInfo: boolean;
  supportsValidateConfiguration: boolean;
  /** Utiliza exclusivamente AI Orchestrator (EPC-16). */
  usesAiOrchestrator: boolean;
  /** Providers apenas via Orchestrator → EPC-07. */
  usesAiProviderFrameworkViaOrchestrator: boolean;
  /** Produz exclusivamente AuditExplanation. */
  producesAuditExplanationOnly: boolean;
  /** Nunca toma decisão de aprovação/reprovação. */
  decidesApproval: false;
  /** Nunca executa regras. */
  executesRules: false;
  /** Nunca interpreta contratos. */
  interpretsContracts: false;
  /** Prep — futuro bind Rule Engine (sem implementação). */
  supportsFutureRuleEngine: boolean;
  /** Prep — futuro OCR (sem implementação). */
  supportsFutureOcr: boolean;
  /** Prep — futuro Document Processing (sem implementação). */
  supportsFutureDocumentProcessing: boolean;
  /** Prep — futuro Workflow (sem implementação). */
  supportsFutureWorkflow: boolean;
  /** Prep — futuro TISS Intelligence (sem implementação). */
  supportsFutureTissIntelligence: boolean;
  /** Prep — futuro Contract Foundation (sem implementação). */
  supportsFutureContractFoundation: boolean;
};

export type AIAuditorProviderInfo = {
  providerId: AIAuditorProviderId;
  adapterId: string;
  name: string;
  version: string;
  status: "ready" | "unhealthy" | "stub";
  usesAiOrchestrator: boolean;
  usesAiProviderFrameworkViaOrchestrator: boolean;
  producesAuditExplanationOnly: boolean;
  description?: string;
};

export type AIAuditorConfigurationValidation = {
  ok: boolean;
  provider: AIAuditorProviderId;
  errors: readonly string[];
  warnings: readonly string[];
  message?: string;
  orchestratorOk?: boolean;
};

/** Opções de resolução do AIAuditorPort (provider factory). */
export type AIAuditorProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultMockAIAuditorAdapter).
   */
  provider?: AIAuditorProviderId;
};
