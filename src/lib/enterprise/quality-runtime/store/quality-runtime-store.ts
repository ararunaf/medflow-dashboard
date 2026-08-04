/**
 * QualityRuntimeStore — contrato interno do store (F3-CAP-13).
 *
 * Camada entre Adapter e estado in-process.
 * NÃO é banco; NÃO cria migrations; NÃO executa avaliação funcional.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type { QualityAssessment, QualityResult, QualityStatistics } from "../ports/canonical";

export type StoredQualityRuntimeAssessment = QualityAssessment;
export type StoredQualityRuntimeResult = QualityResult;

export interface QualityRuntimeStore {
  readonly storeId: string;

  getAssessment(assessmentId: string): StoredQualityRuntimeAssessment | undefined;
  setAssessment(assessment: StoredQualityRuntimeAssessment): void;
  removeAssessment(assessmentId: string): void;
  listAssessments(): readonly StoredQualityRuntimeAssessment[];
  assessmentCount(): number;

  getResult(resultId: string): StoredQualityRuntimeResult | undefined;
  setResult(result: StoredQualityRuntimeResult): void;
  listResults(): readonly StoredQualityRuntimeResult[];
  resultCount(): number;

  statistics(): QualityStatistics;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
