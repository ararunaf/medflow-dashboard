/**
 * DefaultDocumentIntakeAdapter — adapter default de Document Intake (EPC-12).
 *
 * Encapsula o Default Document Intake Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera UI / APIs.
 * NÃO executa OCR, IA, upload, watcher, scanner ou e-mail.
 */
import { createIntakeId } from "../ports/identity";
import type { DocumentIntakePort } from "../ports/document-intake-port";
import type {
  CreateIntakeInput,
  CreateIntakeResult,
  DocumentIntake,
  DocumentIntakeCapabilities,
  DocumentIntakeHealth,
  GetIntakeInput,
  GetIntakeResult,
  ListIntakesInput,
  ListIntakesResult,
} from "../ports/types";
import { DefaultDocumentIntakeStore, type DocumentIntakeStore } from "../store";

export const DEFAULT_DOCUMENT_INTAKE_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultDocumentIntakeRuntime = {
  /** Store ativo. Default: DefaultDocumentIntakeStore in-process. */
  store?: DocumentIntakeStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultDocumentIntakeRuntime {
  return {
    store: new DefaultDocumentIntakeStore(),
  };
}

function nowIso(runtime: DefaultDocumentIntakeRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultDocumentIntakeAdapter implements DocumentIntakePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultDocumentIntakeRuntime;
  private readonly store: DocumentIntakeStore;

  constructor(runtime: DefaultDocumentIntakeRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultDocumentIntakeStore();
  }

  capabilities(): DocumentIntakeCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_DOCUMENT_INTAKE_ADAPTER_ID,
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
            ? "Default document-intake probe ok."
            : "Default document-intake probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultDocumentIntakeStore pronto (sem I/O externo — EPC-12).",
    };
  }

  async createIntake(input: CreateIntakeInput): Promise<CreateIntakeResult> {
    const stamp = nowIso(this.runtime);
    const intakeId = input.intake.intakeId ?? this.runtime.createId?.() ?? createIntakeId();
    const existing = this.store.getIntake(intakeId);

    const intake: DocumentIntake = {
      ...input.intake,
      intakeId,
      sourceType: input.intake.sourceType,
      receivedAt: existing?.receivedAt ?? input.intake.receivedAt ?? stamp,
      status: input.intake.status ?? existing?.status ?? "RECEIVED",
      priority: input.intake.priority ?? existing?.priority ?? "NORMAL",
    };

    this.store.setIntake(intake);
    return {
      ok: true,
      intakeId,
      intake,
      message: existing ? "intake updated" : "intake created",
      code: existing ? "updated" : "created",
    };
  }

  async getIntake(input: GetIntakeInput): Promise<GetIntakeResult> {
    const intake = this.store.getIntake(input.intakeId);
    if (!intake) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, intake };
  }

  async listIntakes(input: ListIntakesInput = {}): Promise<ListIntakesResult> {
    const intakes = this.store.listIntakes().filter((intake) => matchesList(intake, input));
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
