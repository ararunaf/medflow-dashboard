import {
  getCaptureContractIntelligenceJsonDownloadFn,
  getCaptureContractIntelligenceReportFn,
} from "@/lib/capture/api/capture-server";

export async function fetchCaptureContractIntelligence(sessionId: string) {
  const result = await getCaptureContractIntelligenceReportFn({ data: { sessionId } });
  return result.data;
}

export async function downloadContractIntelligenceJson(sessionId: string): Promise<string> {
  const result = await getCaptureContractIntelligenceJsonDownloadFn({ data: { sessionId } });
  return result.data.signedUrl;
}
