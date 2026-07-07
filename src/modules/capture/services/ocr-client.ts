/**
 * Cliente — consulta e download de resultados OCR.
 */
import {
  getCaptureOcrJsonDownloadFn,
  getCaptureOcrResultFn,
  runCaptureOcrFn,
} from "@/lib/capture/api/capture-server";
import type { OcrResultSummary, RawOcrResult } from "@/lib/capture/ocr";

export type CaptureOcrView = {
  summary: OcrResultSummary | null;
  ocr: RawOcrResult | null;
};

export async function fetchCaptureOcr(sessionId: string): Promise<CaptureOcrView> {
  const res = await getCaptureOcrResultFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
  return {
    summary: (res.data.summary as OcrResultSummary | null) ?? null,
    ocr: res.data.ocr,
  };
}

export async function downloadOcrJson(sessionId: string): Promise<string> {
  const res = await getCaptureOcrJsonDownloadFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
  return res.data.signedUrl;
}

export async function triggerCaptureOcr(sessionId: string): Promise<void> {
  const res = await runCaptureOcrFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
}
