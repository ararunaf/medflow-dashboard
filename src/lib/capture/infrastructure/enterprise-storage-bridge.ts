/**
 * Bridge Captura → StorageProviderPort (STORAGE-01 / EPC-24A).
 *
 * Único caminho autorizado de I/O de storage no domínio de captura.
 * PROIBIDO: ctx.client.storage.from(...) direto no produto.
 *
 * Fluxo (EPC-24A):
 *   Captura → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → createBoundStorageProviderPort(client)  (request-scoped; AER-GA03-A3)
 *     → StorageProviderPort → Adapter → Supabase Storage Backend
 *
 * O Port unbound do Runtime NÃO substitui o bound client neste estágio —
 * cutover de storage request-scoped fica para sprints posteriores.
 */
import {
  DEFAULT_STORAGE_PROVIDER_BUCKET,
  createBoundStorageProviderPort,
  type StorageProviderPort,
  type SupabaseStorageClientLike,
} from "@/lib/enterprise/storage-provider";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { decryptStorageBytes, encryptStorageBytes } from "@/lib/security/storage-encryption";
import { CLINICAL_DOCUMENTS_BUCKET } from "./storage-paths";
import { resolveCaptureEnterpriseRuntime } from "../enterprise/resolve-enterprise-runtime";

export function resolveCaptureStorageProvider(ctx: ServiceCtx): StorageProviderPort {
  // Composition root oficial — prepara cutover sem alterar I/O bound.
  void resolveCaptureEnterpriseRuntime();
  return createBoundStorageProviderPort(ctx.client as unknown as SupabaseStorageClientLike, {
    provider: "supabase",
  });
}

export async function captureStorageUpload(
  ctx: ServiceCtx,
  input: {
    key: string;
    body: Uint8Array;
    contentType?: string;
    upsert?: boolean;
    documentId?: string;
    sessionId?: string;
    container?: string;
    /**
     * SEC-PII-02: criptografa o conteúdo (AES-256-GCM) antes do upload.
     * Reservado para os artefatos JSON derivados do pipeline (OCR, guia
     * estruturada, auditoria, contrato, risco, correção) — onde CPF/nome
     * do paciente ficam em texto pleno. NÃO usar para o documento
     * original (é servido como preview inline `<img>`/signed URL direto,
     * que não descriptografa).
     */
    encrypt?: boolean;
  },
): Promise<void> {
  const port = resolveCaptureStorageProvider(ctx);
  const body = input.encrypt ? await encryptStorageBytes(input.body) : input.body;
  // Cifrado deixa de ser JSON/o que quer que fosse — marcar como binário
  // genérico é o correto, independente do content-type original do chamador.
  const contentType = input.encrypt ? "application/octet-stream" : input.contentType;
  const result = await port.upload({
    key: input.key,
    body,
    contentType,
    container: input.container ?? CLINICAL_DOCUMENTS_BUCKET ?? DEFAULT_STORAGE_PROVIDER_BUCKET,
    upsert: input.upsert,
    documentId: input.documentId,
    sessionId: input.sessionId,
    tenantRef: ctx.tenantId,
  });
  if (!result.ok) {
    throw new Error(result.message ?? "StorageProviderPort.upload falhou.");
  }
}

export async function captureStorageDownload(
  ctx: ServiceCtx,
  input: {
    key: string;
    documentId?: string;
    sessionId?: string;
    container?: string;
    /** SEC-PII-02: descriptografa o conteúdo baixado — ver captureStorageUpload. */
    encrypted?: boolean;
  },
): Promise<Uint8Array | null> {
  const port = resolveCaptureStorageProvider(ctx);
  const result = await port.download({
    key: input.key,
    container: input.container ?? CLINICAL_DOCUMENTS_BUCKET ?? DEFAULT_STORAGE_PROVIDER_BUCKET,
    documentId: input.documentId,
    sessionId: input.sessionId,
    tenantRef: ctx.tenantId,
  });
  if (!result.ok || !result.body) return null;
  return input.encrypted ? await decryptStorageBytes(result.body) : result.body;
}

export async function captureStorageSignedUrl(
  ctx: ServiceCtx,
  input: {
    key: string;
    expiresInSeconds?: number;
    downloadFilename?: string;
    documentId?: string;
    sessionId?: string;
    container?: string;
  },
): Promise<{ signedUrl: string; expiresAt: string }> {
  const port = resolveCaptureStorageProvider(ctx);
  const result = await port.signedUrl({
    key: input.key,
    container: input.container ?? CLINICAL_DOCUMENTS_BUCKET ?? DEFAULT_STORAGE_PROVIDER_BUCKET,
    expiresInSeconds: input.expiresInSeconds,
    downloadFilename: input.downloadFilename,
    documentId: input.documentId,
    sessionId: input.sessionId,
    tenantRef: ctx.tenantId,
  });
  if (!result.ok || !result.signedUrl || !result.expiresAt) {
    throw new Error(result.message ?? "StorageProviderPort.signedUrl falhou.");
  }
  return { signedUrl: result.signedUrl, expiresAt: result.expiresAt };
}

export async function captureStorageDelete(
  ctx: ServiceCtx,
  input: { key: string; documentId?: string; sessionId?: string; container?: string },
): Promise<void> {
  const port = resolveCaptureStorageProvider(ctx);
  const result = await port.delete({
    key: input.key,
    container: input.container ?? CLINICAL_DOCUMENTS_BUCKET ?? DEFAULT_STORAGE_PROVIDER_BUCKET,
    documentId: input.documentId,
    sessionId: input.sessionId,
    tenantRef: ctx.tenantId,
  });
  if (!result.ok) {
    throw new Error(result.message ?? "StorageProviderPort.delete falhou.");
  }
}

/** Upload + public URL via StorageProviderPort (branding / assets públicos). */
export async function productStorageUploadPublic(
  client: unknown,
  input: {
    key: string;
    body: Uint8Array;
    contentType?: string;
    container: string;
    upsert?: boolean;
  },
): Promise<{ publicUrl: string }> {
  const port = createBoundStorageProviderPort(client as SupabaseStorageClientLike, {
    provider: "supabase",
  });
  const upload = await port.upload({
    key: input.key,
    body: input.body,
    contentType: input.contentType,
    container: input.container,
    upsert: input.upsert ?? true,
  });
  if (!upload.ok) {
    throw new Error(upload.message ?? "StorageProviderPort.upload falhou.");
  }
  const pub = await port.publicUrl({
    key: input.key,
    container: input.container,
  });
  if (!pub.ok || !pub.signedUrl) {
    throw new Error(pub.message ?? "StorageProviderPort.publicUrl falhou.");
  }
  return { publicUrl: pub.signedUrl };
}
