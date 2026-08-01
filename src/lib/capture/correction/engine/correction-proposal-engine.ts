/**
 * CorrectionProposalEngine — transforma AuditFindings em propostas supervisionadas.
 * MEDICFLOW-CORRECTION-ASSISTANT-01
 *
 * Utiliza exclusivamente AuditFindings produzidos pela Auditoria Preventiva.
 * Nunca altera automaticamente os dados da guia.
 */
import type { AuditFinding } from "../../audit/types/audit-finding";
import type { CorrectionProposal, CorrectionSource } from "../types/correction-proposal";

export const CORRECTION_ENGINE_VERSION = "correction_assistant_v1";

const LEGAL_REFERENCES: Partial<Record<CorrectionSource, string>> = {
  TISS: "Manual de Orientação do Padrão TISS — ANS",
  TUSS: "Tabela TUSS — ANS",
  Contrato: "Contrato operadora-prestador e regras de autorização",
};

export function buildFindingId(finding: AuditFinding): string {
  return `${finding.ruleId}::${finding.field}`;
}

export function buildProposalId(findingId: string): string {
  return `prop-${findingId.replace(/::/g, "-")}`;
}

function resolveSource(finding: AuditFinding): CorrectionSource {
  if (finding.ruleId.startsWith("TISS")) return "TISS";
  if (
    finding.ruleId.startsWith("TUSS") ||
    finding.ruleId.startsWith("PROC") ||
    finding.category === "procedimentos"
  ) {
    return "TUSS";
  }
  if (finding.ruleId.startsWith("AUT") || finding.category === "autorizacoes") {
    return "Contrato";
  }
  return "Regra interna";
}

function resolveLegalReference(source: CorrectionSource): string | undefined {
  return LEGAL_REFERENCES[source];
}

function computeProposalConfidence(finding: AuditFinding): number {
  let confidence = finding.confidence;

  if (finding.expectedValue != null) {
    confidence = Math.min(1, confidence + 0.15);
  }
  if (finding.blocking) {
    confidence = Math.min(1, confidence + 0.05);
  }
  if (finding.detectedValue == null && finding.expectedValue != null) {
    confidence = Math.max(confidence, 0.65);
  }
  if (finding.severity === "critico" || finding.severity === "alto") {
    confidence = Math.max(confidence, 0.55);
  }

  return Math.round(Math.min(1, Math.max(0, confidence)) * 100) / 100;
}

function buildJustification(finding: AuditFinding): string {
  const parts = [finding.message, finding.suggestedCorrection];
  if (finding.expectedValue != null) {
    parts.push(`Valor esperado: ${finding.expectedValue}.`);
  }
  return parts.filter(Boolean).join(" ");
}

function resolveSuggestedValue(finding: AuditFinding): string | null {
  if (finding.expectedValue != null) return finding.expectedValue;
  if (finding.detectedValue == null) return null;
  return null;
}

function findingToProposal(finding: AuditFinding): CorrectionProposal {
  const findingId = buildFindingId(finding);
  const source = resolveSource(finding);

  return {
    proposalId: buildProposalId(findingId),
    findingId,
    ruleId: finding.ruleId,
    field: finding.field,
    currentValue: finding.detectedValue,
    suggestedValue: resolveSuggestedValue(finding),
    confidence: computeProposalConfidence(finding),
    justification: buildJustification(finding),
    source,
    legalReference: resolveLegalReference(source),
    status: "pending",
    blocking: finding.blocking,
    severity: finding.severity,
  };
}

export class CorrectionProposalEngine {
  generateFromFindings(
    findings: AuditFinding[],
    sessionId: string,
  ): { proposals: CorrectionProposal[]; sessionId: string } {
    const proposals = findings.map(findingToProposal);
    return { proposals, sessionId };
  }
}

let defaultEngine: CorrectionProposalEngine | null = null;

export function getDefaultCorrectionProposalEngine(): CorrectionProposalEngine {
  if (!defaultEngine) defaultEngine = new CorrectionProposalEngine();
  return defaultEngine;
}

export function generateCorrectionProposals(
  findings: AuditFinding[],
  sessionId: string,
): CorrectionProposal[] {
  return getDefaultCorrectionProposalEngine().generateFromFindings(findings, sessionId).proposals;
}
