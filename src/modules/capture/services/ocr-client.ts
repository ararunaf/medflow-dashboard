/**
 * Cliente — consulta e download de resultados OCR.
 */
import {
  getCaptureOcrJsonDownloadFn,
  getCaptureOcrResultFn,
  runCaptureOcrFn,
} from "@/lib/capture/api/capture-server";
import type { OcrResultSummary, RawOcrResult } from "@/lib/capture/ocr";
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export type CaptureOcrView = {
  summary: OcrResultSummary | null;
  ocr: RawOcrResult | null;
};

type OcrResultFnData = {
  summary: unknown;
  ocr: RawOcrResult | null;
};

export async function fetchCaptureOcr(sessionId: string): Promise<CaptureOcrView> {
  const res = (await getCaptureOcrResultFn({
    data: { sessionId },
  })) as QueryResult<OcrResultFnData>;
  const data = unwrap<OcrResultFnData>(res);
  return {
    summary: (data.summary as OcrResultSummary | null) ?? null,
    ocr: data.ocr,
  };
}

export async function downloadOcrJson(sessionId: string): Promise<string> {
  const res = (await getCaptureOcrJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}

export async function triggerCaptureOcr(sessionId: string): Promise<void> {
  const res = (await runCaptureOcrFn({ data: { sessionId } })) as MutationResult<unknown>;
  unwrap(res);
}
