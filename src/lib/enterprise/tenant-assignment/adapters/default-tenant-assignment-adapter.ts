/**
 * DefaultTenantAssignmentAdapter — adapter default de Assignment Objects (EPC-10B).
 *
 * Encapsula o Default Tenant Assignment Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Auth / UI / APIs.
 * NÃO carrega Rule Packs, AI Providers, Storage, Configuration ou Documents.
 * NÃO implementa ligações operacionais.
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
} from "../ports/types";
import { DefaultTenantAssignmentStore, type TenantAssignmentStore } from "../store";

export const DEFAULT_TENANT_ASSIGNMENT_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultTenantAssignmentRuntime = {
  /** Store ativo. Default: DefaultTenantAssignmentStore in-process. */
  store?: TenantAssignmentStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultTenantAssignmentRuntime {
  return {
    store: new DefaultTenantAssignmentStore(),
  };
}

function nowIso(runtime: DefaultTenantAssignmentRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultTenantAssignmentAdapter implements TenantAssignmentPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultTenantAssignmentRuntime;
  private readonly store: TenantAssignmentStore;

  constructor(runtime: DefaultTenantAssignmentRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultTenantAssignmentStore();
  }

  capabilities(): TenantAssignmentCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_TENANT_ASSIGNMENT_ADAPTER_ID,
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default tenant-assignment probe ok."
            : "Default tenant-assignment probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultTenantAssignmentStore pronto (sem I/O externo — EPC-10B).",
    };
  }

  async createAssignment(input: CreateAssignmentInput): Promise<CreateAssignmentResult> {
    const stamp = nowIso(this.runtime);
    const assignmentId =
      input.assignment.assignmentId ?? this.runtime.createId?.() ?? createAssignmentUuid();
    const existing = this.store.getAssignment(assignmentId);

    const assignment = {
      ...input.assignment,
      assignmentId,
      createdAt: existing?.createdAt ?? input.assignment.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.assignment.status ?? existing?.status ?? "DRAFT",
    } as TenantAssignment;

    this.store.setAssignment(assignment);
    return {
      ok: true,
      assignmentId,
      assignment,
      message: existing ? "assignment updated" : "assignment created",
    };
  }

  async getAssignment(input: GetAssignmentInput): Promise<GetAssignmentResult> {
    const assignment = this.store.getAssignment(input.assignmentId);
    if (!assignment) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, assignment };
  }

  async listAssignments(input: ListAssignmentsInput = {}): Promise<ListAssignmentsResult> {
    const assignments = this.store
      .listAssignments()
      .filter((assignment) => matchesList(assignment, input));
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
