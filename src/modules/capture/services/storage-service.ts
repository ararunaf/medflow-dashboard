/**
 * Serviço de storage — wrapper sobre server functions de captura.
 */
import {
  cancelCaptureSessionFn,
  getCaptureDownloadUrlFn,
  getCapturePreviewUrlFn,
  retryCaptureUploadFn,
  uploadCaptureFileFn,
} from "@/lib/capture/api/capture-server";
import type {
  CaptureDocumentRecord,
  CaptureSessionDetail,
  CaptureSessionStatus,
} from "@/lib/capture/types";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";
import { fileToBase64 } from "../utils/file-format";

export type StorageUploadResult = {
  sessionId: string;
  documentId: string;
  status: CaptureSessionStatus;
  version: number;
};

type UploadFnData = {
  session: CaptureSessionDetail;
  document: CaptureDocumentRecord;
};

function documentVersion(metadata: CaptureDocumentRecord["metadata"] | undefined): number {
  const version = metadata?.version;
  return typeof version === "number" ? version : 1;
}

export async function uploadCaptureFile(
  sessionId: string,
  file: File,
): Promise<StorageUploadResult> {
  const base64Content = await fileToBase64(file);
  const res = (await uploadCaptureFileFn({
    data: {
      sessionId,
      file: {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Content,
      },
    },
  })) as MutationResult<UploadFnData>;
  const data = unwrap<UploadFnData>(res);
  return {
    sessionId: data.session.id,
    documentId: data.document.id,
    status: data.session.status,
    version: documentVersion(data.document.metadata),
  };
}

export async function retryCaptureUpload(
  sessionId: string,
  file: File,
): Promise<StorageUploadResult> {
  const base64Content = await fileToBase64(file);
  const res = (await retryCaptureUploadFn({
    data: {
      sessionId,
      file: {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Content,
      },
    },
  })) as MutationResult<UploadFnData>;
  const data = unwrap<UploadFnData>(res);
  return {
    sessionId: data.session.id,
    documentId: data.document.id,
    status: data.session.status,
    version: documentVersion(data.document.metadata),
  };
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
