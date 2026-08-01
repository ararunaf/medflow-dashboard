/**
 * TenantAssignmentStore — contrato interno do store (EPC-10B).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO carrega componentes alvo.
 */
import type { TenantAssignment } from "../ports/types";

export type StoredTenantAssignment = TenantAssignment;

export interface TenantAssignmentStore {
  readonly storeId: string;

  getAssignment(assignmentId: string): StoredTenantAssignment | undefined;
  setAssignment(assignment: StoredTenantAssignment): void;
  listAssignments(): readonly StoredTenantAssignment[];
  removeAssignment(assignmentId: string): boolean;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}
