/**
 * Ports — AI Orchestrator Foundation (EPC-16).
 */
export type { AIOrchestratorPort } from "./ai-orchestrator-port";

export type {
  AICapabilityId,
  AIOrchestrationConfigurationReference,
  AIOrchestrationMetadataReference,
  AIOrchestrationPriority,
  AIOrchestrationRequest,
  AIOrchestrationResult,
  AIOrchestrationTag,
  AIOrchestrationTaskType,
  AIOrchestratorCapabilities,
  AIOrchestratorHealth,
  AIOrchestratorProviderId,
  AIOrchestratorProviderOptions,
  AIProviderId,
  AIProviderRegistration,
  AISelectionPolicy,
  GetProviderInput,
  GetProviderResult,
  ListAvailableProvidersInput,
  ListAvailableProvidersResult,
} from "./types";

export {
  AI_SELECTION_POLICIES,
  AI_SELECTION_POLICY_CATALOG,
  getSelectionPolicy,
  isKnownSelectionPolicy,
  listSelectionPolicies,
  type AISelectionPolicyDescriptor,
} from "./policies";

export { createOrchestrationRequestId, resetOrchestrationRequestIdSequence } from "./identity";
