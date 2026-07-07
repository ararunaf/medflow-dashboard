/**
 * Cálculo de score de qualidade da guia (0–100).
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 */
import type { AuditFinding } from "../types/audit-finding";
import type { AuditScore, AuditScoreDistribution } from "../types/audit-report";

const SEVERITY_PENALTIES: Record<AuditFinding["severity"], number> = {
  critico: 25,
  alto: 15,
  medio: 8,
  baixo: 3,
};

const APPROVAL_THRESHOLD = 70;

export function countBySeverity(findings: AuditFinding[]): AuditScoreDistribution {
  const dist: AuditScoreDistribution = { critico: 0, alto: 0, medio: 0, baixo: 0 };
  for (const f of findings) {
    dist[f.severity]++;
  }
  return dist;
}

export function calculateAuditScore(findings: AuditFinding[]): AuditScore {
  const distribution = countBySeverity(findings);
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_PENALTIES[f.severity], 0);
  const overall = Math.max(0, Math.min(100, 100 - penalty));
  const blocking = findings.some((f) => f.blocking);
  const approved = !blocking && overall >= APPROVAL_THRESHOLD;

  return { overall, distribution, approved, blocking };
}

export function buildReportSummary(findings: AuditFinding[], score: AuditScore) {
  const dist = score.distribution;
  return {
    totalFindings: findings.length,
    criticalCount: dist.critico,
    highCount: dist.alto,
    mediumCount: dist.medio,
    lowCount: dist.baixo,
    blockingCount: findings.filter((f) => f.blocking).length,
    approved: score.approved,
  };
}
