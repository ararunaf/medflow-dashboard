/**
 * AIAuditorStore — contrato interno do store (EPC-18).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO executa IA.
 */
import type { AuditExplanation, AuditRequest } from "../ports/types";

export type StoredAuditExplanation = {
  request: AuditRequest;
  explanation: AuditExplanation;
};

export interface AIAuditorStore {
  readonly storeId: string;

  getExplanation(auditId: string): StoredAuditExplanation | undefined;
  setExplanation(entry: StoredAuditExplanation): void;
  listExplanations(): readonly StoredAuditExplanation[];
  removeExplanation(auditId: string): boolean;
  count(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
