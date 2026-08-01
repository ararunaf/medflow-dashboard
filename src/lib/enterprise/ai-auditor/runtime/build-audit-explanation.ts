/**
 * Construtor determinístico de AuditExplanation — EPC-18.
 *
 * Sem IA. Sem LLM. Sem HTTP. Sem prompts.
 * Ecoa o resultado determinístico; não interpreta nem decide.
 */
import type { AIProviderId } from "../../ai-provider";
import { createAuditId } from "../ports/identity";
import type { AuditExplanation, AuditRequest } from "../ports/types";

export const AUDIT_EXPLANATION_VERSION = "1.0.0";

export type BuildAuditExplanationOptions = {
  createId?: () => string;
  now?: () => string;
  selectedAiProvider?: AIProviderId;
};

/**
 * Monta AuditExplanation canônica a partir do pedido.
 * Não avalia regras. Não interpreta contratos. Não chama modelos.
 */
export function buildDeterministicAuditExplanation(
  request: AuditRequest,
  options: BuildAuditExplanationOptions = {},
): AuditExplanation {
  const auditId = request.auditId ?? (options.createId ?? createAuditId)();
  const outcome = request.deterministicOutcome;
  const timestamp = options.now?.() ?? new Date().toISOString();

  const summary =
    outcome?.summary ??
    "Foundation AuditExplanation (deterministic, no LLM). Echo of deterministic outcome only.";

  return {
    auditId,
    summary,
    evidenceList: outcome?.evidenceList,
    relatedRules: outcome?.relatedRules ?? request.relatedRules,
    referencedContracts: outcome?.referencedContracts ?? request.referencedContracts,
    confidenceLevel: "UNKNOWN",
    findings: outcome?.findings,
    recommendations: outcome?.recommendations ?? [
      "Foundation only — no AI recommendations generated.",
    ],
    warnings: outcome?.warnings ?? [
      "AI Auditor foundation does not decide, approve, reject, or execute rules.",
    ],
    metadataReference: request.metadataReference,
    configurationReference: request.configurationReference,
    processingReference: request.processingReference,
    workflowReference: request.workflowReference,
    rulePackReference: request.rulePackReference,
    documentReference: request.documentReference,
    timestamp,
    tags: request.tags,
    customAttributes: {
      ...(outcome?.attributes ?? {}),
      ...(request.customAttributes ?? {}),
      foundation: true,
      deterministicCode: outcome?.code,
      deterministicStatus: outcome?.status,
    },
    explanationVersion: AUDIT_EXPLANATION_VERSION,
    selectedAiProvider: options.selectedAiProvider,
    simulated: true,
  };
}
