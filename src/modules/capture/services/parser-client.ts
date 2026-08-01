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
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export type CaptureStructuredGuideView = {
  summary: StructuredGuideSummary | null;
  guide: StructuredGuide | null;
};

type StructuredGuideFnData = {
  summary: unknown;
  guide: StructuredGuide | null;
};

export async function fetchCaptureStructuredGuide(
  sessionId: string,
): Promise<CaptureStructuredGuideView> {
  const res = (await getCaptureStructuredGuideFn({
    data: { sessionId },
  })) as QueryResult<StructuredGuideFnData>;
  const data = unwrap<StructuredGuideFnData>(res);
  return {
    summary: (data.summary as StructuredGuideSummary | null) ?? null,
    guide: data.guide,
  };
}

export async function downloadStructuredGuideJson(sessionId: string): Promise<string> {
  const res = (await getCaptureStructuredGuideJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}

export async function triggerCaptureParser(sessionId: string): Promise<void> {
  const res = (await runCaptureParserFn({ data: { sessionId } })) as MutationResult<unknown>;
  unwrap(res);
}
