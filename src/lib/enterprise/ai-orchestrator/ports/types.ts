/**
 * Tipos vendor-agnósticos do AI Orchestrator — EPC-16.
 *
 * O Orchestrator NÃO conhece contratos, TISS, OCR, Workflow, Rule Engine,
 * cooperativas ou operadoras. Conversa apenas com o AI Provider Framework (EPC-07).
 *
 * Arquitetura obrigatória:
 *   Application → AIOrchestratorPort → Adapter → Store → Factory → Provider
 *     → AI Provider Framework (EPC-07)
 */
import type { AICapabilityId, AIProviderId, AIProviderRegistration } from "../../ai-provider";
import type { AISelectionPolicy } from "./policies";

export type { AICapabilityId, AIProviderId, AIProviderRegistration };
export type { AISelectionPolicy };

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id) — distinto do AIProviderId (EPC-07)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do AI Orchestrator (extensível). */
export type AIOrchestratorProviderId = "default" | "mock" | "test";

/** Prioridade estrutural da solicitação (sem ranking de negócio). */
export type AIOrchestrationPriority = "low" | "normal" | "high" | "critical" | (string & {});

/** Tipo de tarefa opaco — sem semântica clínica / TISS / auditoria. */
export type AIOrchestrationTaskType = string;

/** Tag genérica — classificação livre. */
export type AIOrchestrationTag = string;

/* ─────────────────────────────────────────────────────────────────────────
 * Referências opacas (prep — sem acoplamento a Engines)
 * ───────────────────────────────────────────────────────────────────────── */

/** Referência opaca a Configuration Engine. */
export type AIOrchestrationConfigurationReference = {
  id?: string;
  kind?: string;
  version?: string;
  namespace?: string;
};

/** Referência opaca a Metadata Engine. */
export type AIOrchestrationMetadataReference = {
  id?: string;
  name?: string;
  namespace?: string;
  version?: string;
  kind?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AIOrchestrationRequest (FASE 6) — modelo canônico
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Solicitação canônica de orquestração.
 * Seleciona Provider — NÃO executa IA.
 */
export type AIOrchestrationRequest = {
  requestId?: string;
  taskType?: AIOrchestrationTaskType;
  priority?: AIOrchestrationPriority;
  requestedCapabilities?: readonly AICapabilityId[];
  preferredProviders?: readonly AIProviderId[];
  fallbackProviders?: readonly AIProviderId[];
  /** Política estrutural; fundação aplica FIRST_AVAILABLE. */
  selectionPolicy?: AISelectionPolicy;
  configurationReference?: AIOrchestrationConfigurationReference;
  metadataReference?: AIOrchestrationMetadataReference;
  tags?: readonly AIOrchestrationTag[];
  /** Atributos livres opacos — sem schema clínico / TISS / auditoria. */
  customAttributes?: Readonly<Record<string, unknown>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * AIOrchestrationResult (FASE 7) — modelo canônico
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado canônico de seleção.
 * Sem execução real de IA. Sem HTTP. Sem prompts.
 */
export type AIOrchestrationResult = {
  ok: boolean;
  requestId: string;
  selectedProvider?: AIProviderId;
  selectionReason?: string;
  capabilitiesMatched?: readonly AICapabilityId[];
  executionPolicy?: AISelectionPolicy;
  metadataReference?: AIOrchestrationMetadataReference;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type AIOrchestratorHealth = {
  ok: boolean;
  provider: AIOrchestratorProviderId;
  latencyMs?: number;
  message?: string;
  /** Contagem de Providers disponíveis via EPC-07 Registry. */
  availableProviderCount?: number;
  /** Contagem de seleções armazenadas no store. */
  storedSelectionCount?: number;
};

/**
 * Capacidades do Orchestrator Port (adapter-level).
 */
export type AIOrchestratorCapabilities = {
  provider: AIOrchestratorProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsSelectProvider: boolean;
  supportsGetProvider: boolean;
  supportsListAvailableProviders: boolean;
  supportsMultipleProviders: boolean;
  supportsSelectionPolicies: boolean;
  /** Integra exclusivamente o AI Provider Framework (EPC-07). */
  usesAiProviderFramework: boolean;
  /** Preparação para AI Auditor (sem bind). */
  supportsFutureAiAuditor: boolean;
  /** Preparação para OCR (sem bind). */
  supportsFutureOcr: boolean;
  /** Preparação para Workflow (sem bind). */
  supportsFutureWorkflow: boolean;
  /** Preparação para Rule Engine (sem bind). */
  supportsFutureRuleEngine: boolean;
  /** Preparação para Contract Foundation (sem bind). */
  supportsFutureContractFoundation: boolean;
  /** Preparação para Document Processing (sem bind). */
  supportsFutureDocumentProcessing: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type GetProviderInput = {
  providerId: AIProviderId;
};

export type GetProviderResult = {
  ok: boolean;
  provider?: AIProviderRegistration;
  message?: string;
  code?: string;
};

export type ListAvailableProvidersInput = {
  /** Filtra por status declarado no Registry EPC-07. */
  status?: "ready" | "stub" | "disabled" | "unhealthy";
  /** Filtra Providers que declaram a capability. */
  capability?: AICapabilityId;
  /** Inclui stubs (default: true — fundação lista todos registrados). */
  includeStubs?: boolean;
};

export type ListAvailableProvidersResult = {
  ok: boolean;
  providers: readonly AIProviderRegistration[];
  message?: string;
  code?: string;
};

/** Opções de resolução do AIOrchestratorPort (provider factory). */
export type AIOrchestratorProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: AIOrchestratorProviderId;
};
