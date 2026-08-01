/**
 * MockDocumentIntakeAdapter — EPC-12.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 */
import { createIntakeId } from "../ports/identity";
import type { DocumentIntakePort } from "../ports/document-intake-port";
import type {
  CreateIntakeInput,
  CreateIntakeResult,
  DocumentIntake,
  DocumentIntakeCapabilities,
  DocumentIntakeHealth,
  DocumentIntakeProviderId,
  GetIntakeInput,
  GetIntakeResult,
  ListIntakesInput,
  ListIntakesResult,
} from "../ports/types";

export type MockDocumentIntakeAdapterOptions = {
  provider?: Extract<DocumentIntakeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  intakes?: readonly DocumentIntake[];
  createId?: () => string;
  now?: () => string;
};

export class MockDocumentIntakeAdapter implements DocumentIntakePort {
  readonly providerId: Extract<DocumentIntakeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly intakes = new Map<string, DocumentIntake>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockDocumentIntakeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} document-intake ready.`;
    this.createId = options.createId ?? createIntakeId;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const intake of options.intakes ?? []) {
      this.intakes.set(intake.intakeId, intake);
    }
  }

  capabilities(): DocumentIntakeCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsCreateIntake: true,
      supportsGetIntake: true,
      supportsListIntakes: true,
      supportsMultipleSources: true,
      supportsDocumentIdentityReference: true,
      supportsStorageReference: true,
      supportsMetadataReference: true,
      supportsWorkflowReference: true,
      supportsConfigurationReference: true,
      supportsLifecycle: true,
    };
  }

  async health(): Promise<DocumentIntakeHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createIntake(input: CreateIntakeInput): Promise<CreateIntakeResult> {
    const stamp = this.now();
    const intakeId = input.intake.intakeId ?? this.createId();
    const existing = this.intakes.get(intakeId);

    const intake: DocumentIntake = {
      ...input.intake,
      intakeId,
      sourceType: input.intake.sourceType,
      receivedAt: existing?.receivedAt ?? input.intake.receivedAt ?? stamp,
      status: input.intake.status ?? existing?.status ?? "RECEIVED",
      priority: input.intake.priority ?? existing?.priority ?? "NORMAL",
    };

    this.intakes.set(intakeId, intake);
    return {
      ok: true,
      intakeId,
      intake,
      message: existing ? "intake updated" : "intake created",
      code: existing ? "updated" : "created",
    };
  }

  async getIntake(input: GetIntakeInput): Promise<GetIntakeResult> {
    const intake = this.intakes.get(input.intakeId);
    if (!intake) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, intake };
  }

  async listIntakes(input: ListIntakesInput = {}): Promise<ListIntakesResult> {
    const intakes = [...this.intakes.values()].filter((intake) => matchesList(intake, input));
    return { ok: true, intakes };
  }
}

function matchesList(intake: DocumentIntake, input: ListIntakesInput): boolean {
  if (input.sourceType != null && intake.sourceType !== input.sourceType) return false;
  if (input.status != null && intake.status !== input.status) return false;
  if (input.priority != null && intake.priority !== input.priority) return false;
  if (input.tag != null && !(intake.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !intake.intakeId.startsWith(input.idPrefix)) return false;
  if (input.documentId != null) {
    if (intake.documentIdentityReference?.documentId !== input.documentId) return false;
  }
  if (input.workflowId != null) {
    if (intake.workflowReference?.workflowId !== input.workflowId) return false;
  }
  return true;
}
