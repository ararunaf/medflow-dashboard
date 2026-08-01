/**
 * MockTenantAssignmentAdapter — EPC-10B.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 */
import { createAssignmentUuid } from "../ports/assignment";
import type { TenantAssignmentPort } from "../ports/tenant-assignment-port";
import type {
  CreateAssignmentInput,
  CreateAssignmentResult,
  GetAssignmentInput,
  GetAssignmentResult,
  ListAssignmentsInput,
  ListAssignmentsResult,
  TenantAssignment,
  TenantAssignmentCapabilities,
  TenantAssignmentHealth,
  TenantAssignmentProviderId,
} from "../ports/types";

export type MockTenantAssignmentAdapterOptions = {
  provider?: Extract<TenantAssignmentProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  assignments?: readonly TenantAssignment[];
  createId?: () => string;
  now?: () => string;
};

export class MockTenantAssignmentAdapter implements TenantAssignmentPort {
  readonly providerId: Extract<TenantAssignmentProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly assignments = new Map<string, TenantAssignment>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockTenantAssignmentAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} tenant-assignment ready.`;
    this.createId = options.createId ?? createAssignmentUuid;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const assignment of options.assignments ?? []) {
      this.assignments.set(assignment.assignmentId, assignment);
    }
  }

  capabilities(): TenantAssignmentCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsCreateAssignment: true,
      supportsGetAssignment: true,
      supportsListAssignments: true,
      supportsAssignmentKinds: true,
      supportsLifecycleStatus: true,
      supportsVersioning: true,
      supportsMetadataReference: true,
    };
  }

  async health(): Promise<TenantAssignmentHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createAssignment(input: CreateAssignmentInput): Promise<CreateAssignmentResult> {
    const stamp = this.now();
    const assignmentId = input.assignment.assignmentId ?? this.createId();
    const existing = this.assignments.get(assignmentId);

    const assignment = {
      ...input.assignment,
      assignmentId,
      createdAt: existing?.createdAt ?? input.assignment.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.assignment.status ?? existing?.status ?? "DRAFT",
    } as TenantAssignment;

    this.assignments.set(assignmentId, assignment);
    return {
      ok: true,
      assignmentId,
      assignment,
      message: existing ? "assignment updated" : "assignment created",
    };
  }

  async getAssignment(input: GetAssignmentInput): Promise<GetAssignmentResult> {
    const assignment = this.assignments.get(input.assignmentId);
    if (!assignment) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, assignment };
  }

  async listAssignments(input: ListAssignmentsInput = {}): Promise<ListAssignmentsResult> {
    const assignments = [...this.assignments.values()].filter((assignment) =>
      matchesList(assignment, input),
    );
    return { ok: true, assignments };
  }
}

function matchesList(assignment: TenantAssignment, input: ListAssignmentsInput): boolean {
  if (input.assignmentKind != null && assignment.assignmentKind !== input.assignmentKind) {
    return false;
  }
  if (input.tenantId != null && assignment.tenantReference.tenantId !== input.tenantId) {
    return false;
  }
  if (input.status != null && assignment.status !== input.status) return false;
  if (input.tag != null && !(assignment.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !assignment.assignmentId.startsWith(input.idPrefix)) {
    return false;
  }
  if (input.targetId != null && assignment.targetReference.id !== input.targetId) {
    return false;
  }
  return true;
}
