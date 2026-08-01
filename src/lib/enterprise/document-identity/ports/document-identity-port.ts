/**
 * DocumentIdentityPort — contrato único de identidade documental (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de store, registry ou banco ficam nos adapters.
 *
 * EPC-08: fundação arquitetural genérica.
 * NÃO conhece Guia TISS, Contrato, Nota Fiscal, Prontuário, Exame,
 * Receita, Laudo, OCR, Captura, Storage real, Auditoria ou IA.
 */
import type {
  CreateDocumentInput,
  CreateDocumentResult,
  DocumentIdentityCapabilities,
  DocumentIdentityHealth,
  DocumentIdentityProviderId,
  GetDocumentInput,
  GetDocumentResult,
  ListDocumentsInput,
  ListDocumentsResult,
} from "./types";

export interface DocumentIdentityPort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: DocumentIdentityProviderId;

  /** Verificação leve de prontidão (sem alterar documentos). */
  health(): Promise<DocumentIdentityHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): DocumentIdentityCapabilities;

  /** Cria / registra um documento canônico. */
  createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult>;

  /** Obtém um documento por DocumentId. */
  getDocument(input: GetDocumentInput): Promise<GetDocumentResult>;

  /** Lista documentos (filtros estruturais opcionais). */
  listDocuments(input?: ListDocumentsInput): Promise<ListDocumentsResult>;
}
