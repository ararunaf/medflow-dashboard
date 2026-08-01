/**
 * DefaultTenantAssignmentStore — store in-process padrão (EPC-10B).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 * Pode ser seedado via opções / runtime do adapter.
 */
import type { StoredTenantAssignment, TenantAssignmentStore } from "./tenant-assignment-store";

export const DEFAULT_TENANT_ASSIGNMENT_STORE_ID = "default-in-process";

export type DefaultTenantAssignmentStoreOptions = {
  assignments?: readonly StoredTenantAssignment[];
};

export class DefaultTenantAssignmentStore implements TenantAssignmentStore {
  readonly storeId = DEFAULT_TENANT_ASSIGNMENT_STORE_ID;

  private readonly assignments = new Map<string, StoredTenantAssignment>();

  constructor(options: DefaultTenantAssignmentStoreOptions = {}) {
    for (const assignment of options.assignments ?? []) {
      this.assignments.set(assignment.assignmentId, assignment);
    }
  }

  getAssignment(assignmentId: string): StoredTenantAssignment | undefined {
    return this.assignments.get(assignmentId);
  }

  setAssignment(assignment: StoredTenantAssignment): void {
    this.assignments.set(assignment.assignmentId, assignment);
  }

  listAssignments(): readonly StoredTenantAssignment[] {
    return [...this.assignments.values()];
  }

  removeAssignment(assignmentId: string): boolean {
    return this.assignments.delete(assignmentId);
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultTenantAssignmentStore ready (${this.assignments.size} assignments).`,
    };
  }
}
