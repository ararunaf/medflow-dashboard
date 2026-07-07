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
import type { CaptureSessionStatus } from "@/lib/capture/types";
import { fileToBase64 } from "../utils/file-format";

export type StorageUploadResult = {
  sessionId: string;
  documentId: string;
  status: CaptureSessionStatus;
  version: number;
};

export async function uploadCaptureFile(
  sessionId: string,
  file: File,
): Promise<StorageUploadResult> {
  const base64Content = await fileToBase64(file);
  const res = await uploadCaptureFileFn({
    data: {
      sessionId,
      file: {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Content,
      },
    },
  });
  if (!res.ok) throw new Error(res.error.message);
  return {
    sessionId: res.data.session.id,
    documentId: res.data.document.id,
    status: res.data.session.status,
    version: res.data.document.metadata?.version ?? 1,
  };
}

export async function retryCaptureUpload(
  sessionId: string,
  file: File,
): Promise<StorageUploadResult> {
  const base64Content = await fileToBase64(file);
  const res = await retryCaptureUploadFn({
    data: {
      sessionId,
      file: {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Content,
      },
    },
  });
  if (!res.ok) throw new Error(res.error.message);
  return {
    sessionId: res.data.session.id,
    documentId: res.data.document.id,
    status: res.data.session.status,
    version: res.data.document.metadata?.version ?? 1,
  };
}

export async function cancelCapture(sessionId: string): Promise<void> {
  const res = await cancelCaptureSessionFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
}

export async function getPreviewUrl(sessionId: string, documentId?: string): Promise<string> {
  const res = await getCapturePreviewUrlFn({
    data: { sessionId, documentId },
  });
  if (!res.ok) throw new Error(res.error.message);
  return res.data.signedUrl;
}

export async function getDownloadUrl(sessionId: string, documentId?: string): Promise<string> {
  const res = await getCaptureDownloadUrlFn({
    data: { sessionId, documentId },
  });
  if (!res.ok) throw new Error(res.error.message);
  return res.data.signedUrl;
}
