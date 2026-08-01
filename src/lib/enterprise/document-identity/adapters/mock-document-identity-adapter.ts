/**
 * MockDocumentIdentityAdapter — EPC-08.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência de store externo.
 */
import { createDocumentUuid } from "../ports/identity";
import type { DocumentIdentityPort } from "../ports/document-identity-port";
import type {
  CreateDocumentInput,
  CreateDocumentResult,
  DocumentIdentity,
  DocumentIdentityCapabilities,
  DocumentIdentityHealth,
  DocumentIdentityProviderId,
  GetDocumentInput,
  GetDocumentResult,
  ListDocumentsInput,
  ListDocumentsResult,
} from "../ports/types";

export type MockDocumentIdentityAdapterOptions = {
  provider?: Extract<DocumentIdentityProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  documents?: readonly DocumentIdentity[];
  createId?: () => string;
  now?: () => string;
};

export class MockDocumentIdentityAdapter implements DocumentIdentityPort {
  readonly providerId: Extract<DocumentIdentityProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly documents = new Map<string, DocumentIdentity>();
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(options: MockDocumentIdentityAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} document-identity ready.`;
    this.createId = options.createId ?? createDocumentUuid;
    this.now = options.now ?? (() => new Date().toISOString());

    for (const document of options.documents ?? []) {
      this.documents.set(document.documentId, document);
    }
  }

  capabilities(): DocumentIdentityCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
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
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      message: this.message,
    };
  }

  async createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult> {
    const stamp = this.now();
    const documentId = input.document.documentId ?? this.createId();
    const existing = this.documents.get(documentId);

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

    this.documents.set(documentId, document);
    return {
      ok: true,
      documentId,
      document,
      message: existing ? "document updated" : "document created",
    };
  }

  async getDocument(input: GetDocumentInput): Promise<GetDocumentResult> {
    const document = this.documents.get(input.documentId);
    if (!document) {
      return { ok: false, message: "not found" };
    }
    return { ok: true, document };
  }

  async listDocuments(input: ListDocumentsInput = {}): Promise<ListDocumentsResult> {
    const documents = [...this.documents.values()].filter((document) =>
      matchesList(document, input),
    );
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
