import {
  getCaptureContractIntelligenceJsonDownloadFn,
  getCaptureContractIntelligenceReportFn,
} from "@/lib/capture/api/capture-server";
import type { QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

type ContractReportData = {
  summary: unknown;
  report: unknown;
  metadata: unknown;
};

export async function fetchCaptureContractIntelligence(sessionId: string) {
  const result = (await getCaptureContractIntelligenceReportFn({
    data: { sessionId },
  })) as QueryResult<ContractReportData>;
  return unwrap<ContractReportData>(result);
}

export async function downloadContractIntelligenceJson(sessionId: string): Promise<string> {
  const result = (await getCaptureContractIntelligenceJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(result).signedUrl;
}
