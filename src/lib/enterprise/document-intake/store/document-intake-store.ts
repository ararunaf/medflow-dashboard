/**
 * DocumentIntakeStore — contrato interno do store (EPC-12).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa OCR / IA / upload.
 */
import type { DocumentIntake } from "../ports/types";

export type StoredDocumentIntake = DocumentIntake;

export interface DocumentIntakeStore {
  readonly storeId: string;

  getIntake(intakeId: string): StoredDocumentIntake | undefined;
  setIntake(intake: StoredDocumentIntake): void;
  listIntakes(): readonly StoredDocumentIntake[];
  removeIntake(intakeId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
