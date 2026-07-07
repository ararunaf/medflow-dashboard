/**
 * Cliente — consulta e download de StructuredGuide.
 * MEDICFLOW-TISS-PARSER-01
 */
import {
  getCaptureStructuredGuideFn,
  getCaptureStructuredGuideJsonDownloadFn,
  runCaptureParserFn,
} from "@/lib/capture/api/capture-server";
import type { StructuredGuide, StructuredGuideSummary } from "@/lib/capture/parser";

export type CaptureStructuredGuideView = {
  summary: StructuredGuideSummary | null;
  guide: StructuredGuide | null;
};

export async function fetchCaptureStructuredGuide(
  sessionId: string,
): Promise<CaptureStructuredGuideView> {
  const res = await getCaptureStructuredGuideFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
  return {
    summary: (res.data.summary as StructuredGuideSummary | null) ?? null,
    guide: res.data.guide,
  };
}

export async function downloadStructuredGuideJson(sessionId: string): Promise<string> {
  const res = await getCaptureStructuredGuideJsonDownloadFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
  return res.data.signedUrl;
}

export async function triggerCaptureParser(sessionId: string): Promise<void> {
  const res = await runCaptureParserFn({ data: { sessionId } });
  if (!res.ok) throw new Error(res.error.message);
}
