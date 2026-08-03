/**
 * PreventiveAuditEngine — transforma StructuredGuide em AuditFindings.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 *
 * Processa exclusivamente o StructuredGuide produzido pelo Parser.
 * Não altera OCR, Parser nem Storage existentes.
 */
import type { StructuredGuide } from "../../parser/types/structured-guide";
import { ensureCaptureTissKnowledge } from "../../enterprise/tiss-knowledge-gateway";
import type { AuditFinding, CorrectionProposal } from "../types/audit-finding";
import type { AuditReport } from "../types/audit-report";
import type { AuditRule } from "../types/audit-rule";
import { buildAuditContext } from "./audit-context";
import { calculateAuditScore, buildReportSummary } from "./score-calculator";
import { ALL_AUDIT_RULES } from "../rules";

export const AUDIT_ENGINE_VERSION = "preventive_audit_v1";

export type PreventiveAuditOptions = {
  sessionId?: string;
  rules?: AuditRule[];
};

export type PreventiveAuditResult = {
  report: AuditReport;
  findings: AuditFinding[];
  proposals: CorrectionProposal[];
};

function buildCorrectionProposals(findings: AuditFinding[]): CorrectionProposal[] {
  return findings.map((f) => ({
    findingRuleId: f.ruleId,
    field: f.field,
    action: f.ruleId.startsWith("AUT")
      ? ("link_authorization" as const)
      : f.category === "assinaturas"
        ? ("upload_document" as const)
        : ("fix_field" as const),
    description: f.suggestedCorrection,
    autoFixable: false as const,
  }));
}

export class PreventiveAuditEngine {
  private readonly rules: AuditRule[];

  constructor(rules: AuditRule[] = ALL_AUDIT_RULES) {
    this.rules = rules;
  }

  /**
   * Auditoria síncrona — exige conhecimento TISS já hidratado via Enterprise Foundation.
   * Preferir auditAsync / auditStructuredGuide (TISS-CONV-01).
   */
  audit(guide: StructuredGuide, options: PreventiveAuditOptions = {}): PreventiveAuditResult {
    const start = Date.now();
    const ctx = buildAuditContext(guide, { sessionId: options.sessionId });
    const rules = options.rules ?? this.rules;

    const findings: AuditFinding[] = [];
    for (const rule of rules) {
      const partial = rule.evaluate(ctx);
      if (partial) {
        findings.push({ ...partial });
      }
    }

    const score = calculateAuditScore(findings);
    const summary = buildReportSummary(findings, score);
    const proposals = buildCorrectionProposals(findings);

    const report: AuditReport = {
      version: "audit_report_v1",
      sessionId: options.sessionId,
      guideType: guide.guideType,
      auditedAt: ctx.evaluatedAt,
      engineVersion: AUDIT_ENGINE_VERSION,
      score,
      findings,
      correctionProposals: proposals,
      summary,
    };

    void start; // duration tracked by service layer
    return { report, findings, proposals };
  }

  /** TISS-CONV-01 — hidrata TISSCatalogPort + RulePackEnginePort antes de auditar. */
  async auditAsync(
    guide: StructuredGuide,
    options: PreventiveAuditOptions = {},
  ): Promise<PreventiveAuditResult> {
    await ensureCaptureTissKnowledge();
    return this.audit(guide, options);
  }
}

let defaultEngine: PreventiveAuditEngine | null = null;

export function getDefaultPreventiveAuditEngine(): PreventiveAuditEngine {
  if (!defaultEngine) defaultEngine = new PreventiveAuditEngine();
  return defaultEngine;
}

/**
 * Auditoria preventiva — hidrata conhecimento TISS via Enterprise Foundation (TISS-CONV-01).
 */
export async function auditStructuredGuide(
  guide: StructuredGuide,
  options?: PreventiveAuditOptions,
): Promise<PreventiveAuditResult> {
  return getDefaultPreventiveAuditEngine().auditAsync(guide, options);
}
