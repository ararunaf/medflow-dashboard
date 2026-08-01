/**
 * DefaultDocumentIdentityAdapter — adapter default de Document Identity (EPC-08).
 *
 * Encapsula o Default Document Identity Store (in-process) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera Storage / OCR / UI / APIs.
 */
import { createDocumentUuid } from "../ports/identity";
import type { DocumentIdentityPort } from "../ports/document-identity-port";
import type {
  CreateDocumentInput,
  CreateDocumentResult,
  DocumentIdentity,
  DocumentIdentityCapabilities,
  DocumentIdentityHealth,
  GetDocumentInput,
  GetDocumentResult,
  ListDocumentsInput,
  ListDocumentsResult,
} from "../ports/types";
import { DefaultDocumentIdentityStore, type DocumentIdentityStore } from "../store";

export const DEFAULT_DOCUMENT_IDENTITY_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind futuro
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultDocumentIdentityRuntime = {
  /** Store ativo. Default: DefaultDocumentIdentityStore in-process. */
  store?: DocumentIdentityStore;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de id injetável (testes). */
  createId?: () => string;
  /** Relógio injetável (testes). */
  now?: () => string;
};

function defaultRuntime(): DefaultDocumentIdentityRuntime {
  return {
    store: new DefaultDocumentIdentityStore(),
  };
}

function nowIso(runtime: DefaultDocumentIdentityRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultDocumentIdentityAdapter implements DocumentIdentityPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultDocumentIdentityRuntime;
  private readonly store: DocumentIdentityStore;

  constructor(runtime: DefaultDocumentIdentityRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultDocumentIdentityStore();
  }

  capabilities(): DocumentIdentityCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_DOCUMENT_IDENTITY_ADAPTER_ID,
      supportsCreateDocument: true,
      supportsGetDocument: true,
      supportsListDocuments: true,
      supportsMetadataReference: true,
      supportsStorageReference: true,
      supportsPages: true,
      supportsCanonicalIdentity: true,
    };
  }

  async health(): Promise<DocumentIdentityHealth> {
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
            ? "Default document-identity probe ok."
            : "Default document-identity probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ?? "DefaultDocumentIdentityStore pronto (sem I/O externo — EPC-08).",
    };
  }

  async createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult> {
    const stamp = nowIso(this.runtime);
    const documentId =
      input.document.documentId ?? this.runtime.createId?.() ?? createDocumentUuid();
    const existing = this.store.getDocument(documentId);

    const document: DocumentIdentity = {
      ...input.document,
      documentId,
      createdAt: existing?.createdAt ?? input.document.createdAt ?? stamp,
      updatedAt: stamp,
      status: input.document.status ?? existing?.status ?? "draft",
      identity: {
        ...input.document.identity,
        uuid: input.document.identity?.uuid ?? documentId,
      },
    };

    this.store.setDocument(document);
    return {
      ok: true,
      documentId,
      document,
      message: existing ? "document updated" : "document created",
    };
  }

  async getDocument(input: GetDocumentInput): Promise<GetDocumentResult> {
    const document = this.store.getDocument(input.documentId);
    if (!document) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, document };
  }

  async listDocuments(input: ListDocumentsInput = {}): Promise<ListDocumentsResult> {
    const documents = this.store.listDocuments().filter((document) => matchesList(document, input));
    return { ok: true, documents };
  }
}

function matchesList(document: DocumentIdentity, input: ListDocumentsInput): boolean {
  if (input.documentType != null && document.documentType !== input.documentType) return false;
  if (input.source != null && document.source !== input.source) return false;
  if (input.status != null && document.status !== input.status) return false;
  if (input.tag != null && !(document.tags ?? []).includes(input.tag)) return false;
  if (input.idPrefix != null && !document.documentId.startsWith(input.idPrefix)) return false;
  if (input.correlationId != null && document.identity?.correlationId !== input.correlationId) {
    return false;
  }
  if (input.externalId != null && document.identity?.externalId !== input.externalId) {
    return false;
  }
  if (input.sourceId != null && document.identity?.sourceId !== input.sourceId) return false;
  return true;
}
