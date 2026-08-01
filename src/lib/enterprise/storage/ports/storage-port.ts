/**
 * StoragePort — contrato único de armazenamento de documentos (Ports & Adapters).
 *
 * Application e Domain dependem exclusivamente desta interface.
 * Detalhes de Supabase Storage / Azure Blob / S3 / GCS / NAS / Local / SharePoint
 * ficam nos adapters.
 *
 * EPC-02: fundação arquitetural. Módulos de upload/OCR/captura NÃO são migrados.
 * Assinaturas usam options bags com `document?: StorageDocumentContext` para
 * receber Document Identity (EPC-08) sem quebra futura de contrato.
 */
import type {
  StorageCapabilities,
  StorageDeleteInput,
  StorageDeleteResult,
  StorageGetInput,
  StorageGetResult,
  StorageHealth,
  StorageProviderId,
  StoragePutInput,
  StoragePutResult,
  StorageSignedUrlInput,
  StorageSignedUrlResult,
} from "./types";

export interface StoragePort {
  /** Identificador estável do provedor por trás do adapter. */
  readonly providerId: StorageProviderId;

  /** Verificação leve de prontidão do provedor (sem alterar objetos). */
  health(): Promise<StorageHealth>;

  /** Capacidades estáticas do adapter ativo. */
  capabilities(): StorageCapabilities;

  /** Armazena um objeto sob uma key lógica. */
  put(input: StoragePutInput): Promise<StoragePutResult>;

  /** Obtém o corpo de um objeto pela key lógica. */
  get(input: StorageGetInput): Promise<StorageGetResult>;

  /** Remove um objeto pela key lógica. */
  delete(input: StorageDeleteInput): Promise<StorageDeleteResult>;

  /** Emite URL assinada / temporária para acesso ao objeto. */
  signedUrl(input: StorageSignedUrlInput): Promise<StorageSignedUrlResult>;
}
