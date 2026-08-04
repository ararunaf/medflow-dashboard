/**
 * InMemoryQualityRuntimeStore — store in-process oficial (F3-CAP-13).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem avaliação funcional).
 */
import type { QualityStatistics } from "../ports/canonical";
import type {
  QualityRuntimeStore,
  StoredQualityRuntimeAssessment,
  StoredQualityRuntimeResult,
} from "./quality-runtime-store";

export const IN_MEMORY_QUALITY_RUNTIME_STORE_ID = "in-memory-quality-runtime";

export type InMemoryQualityRuntimeStoreOptions = {
  assessments?: readonly StoredQualityRuntimeAssessment[];
  results?: readonly StoredQualityRuntimeResult[];
};

export class InMemoryQualityRuntimeStore implements QualityRuntimeStore {
  readonly storeId = IN_MEMORY_QUALITY_RUNTIME_STORE_ID;

  private readonly assessments = new Map<string, StoredQualityRuntimeAssessment>();
  private readonly results = new Map<string, StoredQualityRuntimeResult>();

  constructor(options: InMemoryQualityRuntimeStoreOptions = {}) {
    for (const assessment of options.assessments ?? []) this.setAssessment(assessment);
    for (const result of options.results ?? []) this.setResult(result);
  }

  getAssessment(assessmentId: string): StoredQualityRuntimeAssessment | undefined {
    const assessment = this.assessments.get(assessmentId);
    return assessment ? { ...assessment } : undefined;
  }

  setAssessment(assessment: StoredQualityRuntimeAssessment): void {
    this.assessments.set(assessment.assessmentId, { ...assessment });
  }

  removeAssessment(assessmentId: string): void {
    this.assessments.delete(assessmentId);
  }

  listAssessments(): readonly StoredQualityRuntimeAssessment[] {
    return Array.from(this.assessments.values()).map((assessment) => ({ ...assessment }));
  }

  assessmentCount(): number {
    return this.assessments.size;
  }

  getResult(resultId: string): StoredQualityRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredQualityRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredQualityRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): QualityStatistics {
    const assessments = this.listAssessments();
    let preparedAssessments = 0;
    let totalMetrics = 0;
    for (const assessment of assessments) {
      if (assessment.status === "prepared") preparedAssessments += 1;
      totalMetrics += assessment.metrics?.length ?? 0;
    }
    return {
      kind: "canonical-quality-statistics",
      totalAssessments: assessments.length,
      preparedAssessments,
      totalResults: this.resultCount(),
      totalIssues: 0,
      totalMetrics,
      qualityEngineImplementedCount: 0,
      qualityScoreImplementedCount: 0,
      ocrQualityImplementedCount: 0,
      classificationQualityImplementedCount: 0,
      extractionQualityImplementedCount: 0,
      validationQualityImplementedCount: 0,
      mappingQualityImplementedCount: 0,
      autoFillQualityImplementedCount: 0,
      auditQualityImplementedCount: 0,
      approvalDecisionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Quality Runtime store ready (${this.assessmentCount()} assessments, ${this.resultCount()} results).`,
    };
  }
}
