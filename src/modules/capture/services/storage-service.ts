/**
 * Serviço de storage — wrapper sobre server functions de captura.
 */
import {
  cancelCaptureSessionFn,
  finalizeCaptureDirectUploadFn,
  getCaptureDownloadUrlFn,
  getCapturePreviewUrlFn,
  prepareCaptureDirectUploadFn,
} from "@/lib/capture/api/capture-server";
import {
  CLINICAL_DOCUMENTS_BUCKET,
  type CaptureDocumentRecord,
  type CaptureSessionDetail,
  type CaptureSessionStatus,
} from "@/lib/capture/types";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { sha256Hex } from "../utils/file-format";

export type StorageUploadResult = {
  sessionId: string;
  documentId: string;
  status: CaptureSessionStatus;
  version: number;
};

type PreparedUpload = { storagePath: string; token: string; version: number };

type UploadFnData = {
  session: CaptureSessionDetail;
  document: CaptureDocumentRecord;
};

function documentVersion(metadata: CaptureDocumentRecord["metadata"] | undefined): number {
  const version = metadata?.version;
  return typeof version === "number" ? version : 1;
}

/**
 * Envio direto navegador → Storage (sem passar o arquivo pela server function,
 * que na Vercel corta o corpo em ~4,5 MB):
 *   1. hash SHA-256 local; 2. servidor valida e devolve token para o caminho;
 *   3. navegador grava no bucket; 4. servidor confere o objeto e registra.
 */
async function uploadDirect(
  sessionId: string,
  file: File,
  mode: "initial" | "retry",
): Promise<StorageUploadResult> {
  const declared = {
    sessionId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    byteLength: file.size,
    checksumSha256: await sha256Hex(file),
    mode,
  };
  const prepared = unwrap<PreparedUpload>(
    (await prepareCaptureDirectUploadFn({ data: declared })) as MutationResult<PreparedUpload>,
  );

  const { error } = await getBrowserSupabase()
    .storage.from(CLINICAL_DOCUMENTS_BUCKET)
    .uploadToSignedUrl(prepared.storagePath, prepared.token, file, {
      contentType: declared.mimeType,
    });
  if (error) throw new Error(`Falha ao enviar o arquivo: ${error.message}`);

  const data = unwrap<UploadFnData>(
    (await finalizeCaptureDirectUploadFn({
      data: { ...declared, version: prepared.version },
    })) as MutationResult<UploadFnData>,
  );
  return {
    sessionId: data.session.id,
    documentId: data.document.id,
    status: data.session.status,
    version: documentVersion(data.document.metadata),
  };
}

export function uploadCaptureFile(sessionId: string, file: File): Promise<StorageUploadResult> {
  return uploadDirect(sessionId, file, "initial");
}

export function retryCaptureUpload(sessionId: string, file: File): Promise<StorageUploadResult> {
  return uploadDirect(sessionId, file, "retry");
}

export async function cancelCapture(sessionId: string): Promise<void> {
  const res = (await cancelCaptureSessionFn({
    data: { sessionId },
  })) as MutationResult<unknown>;
  unwrap(res);
}

export async function getPreviewUrl(sessionId: string, documentId?: string): Promise<string> {
  const res = (await getCapturePreviewUrlFn({
    data: { sessionId, documentId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}

export async function getDownloadUrl(sessionId: string, documentId?: string): Promise<string> {
  const res = (await getCaptureDownloadUrlFn({
    data: { sessionId, documentId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}
