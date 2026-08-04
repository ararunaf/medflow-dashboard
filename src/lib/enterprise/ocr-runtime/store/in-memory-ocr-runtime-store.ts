/**
 * InMemoryOCRRuntimeStore — store in-process oficial (F3-CAP-05 + DIP-03 preservado).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem OCR real). Sessões DIP-03 e jobs/requests/documents/results F3-CAP-05
 * convivem no mesmo store.
 */
import type { CanonicalOCRStatistics } from "../ports/canonical";
import type {
  OCRRuntimeStore,
  StoredOCRRuntimeDocument,
  StoredOCRRuntimeJob,
  StoredOCRRuntimeRequest,
  StoredOCRRuntimeResult,
  StoredOCRRuntimeSession,
} from "./ocr-runtime-store";

export const IN_MEMORY_OCR_RUNTIME_STORE_ID = "in-memory-ocr-runtime";

export type InMemoryOCRRuntimeStoreOptions = {
  sessions?: readonly StoredOCRRuntimeSession[];
  jobs?: readonly StoredOCRRuntimeJob[];
  requests?: readonly StoredOCRRuntimeRequest[];
  documents?: readonly StoredOCRRuntimeDocument[];
  results?: readonly StoredOCRRuntimeResult[];
};

export class InMemoryOCRRuntimeStore implements OCRRuntimeStore {
  readonly storeId = IN_MEMORY_OCR_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredOCRRuntimeSession>();
  private readonly jobs = new Map<string, StoredOCRRuntimeJob>();
  private readonly requests = new Map<string, StoredOCRRuntimeRequest>();
  private readonly documents = new Map<string, StoredOCRRuntimeDocument>();
  private readonly results = new Map<string, StoredOCRRuntimeResult>();

  constructor(options: InMemoryOCRRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) this.setSession(session);
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const result of options.results ?? []) this.setResult(result);
  }

  // ---------------------------------------------------------------------
  // DIP-03 — sessões (preservado).
  // ---------------------------------------------------------------------

  getSession(runtimeSessionId: string): StoredOCRRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredOCRRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredOCRRuntimeSession[] {
    return [...this.sessions.values()];
  }

  removeSession(runtimeSessionId: string): boolean {
    return this.sessions.delete(runtimeSessionId);
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  // ---------------------------------------------------------------------
  // F3-CAP-05 — jobs / requests / documents / results estruturais.
  // ---------------------------------------------------------------------

  getJob(jobId: string): StoredOCRRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredOCRRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredOCRRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredOCRRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredOCRRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredOCRRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getDocument(documentId: string): StoredOCRRuntimeDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredOCRRuntimeDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  listDocuments(jobId?: string): readonly StoredOCRRuntimeDocument[] {
    const all = Array.from(this.documents.values()).map((document) => ({ ...document }));
    if (!jobId) return all;
    return all.filter((document) => document.jobId === jobId);
  }

  documentCount(): number {
    return this.documents.size;
  }

  getResult(resultId: string): StoredOCRRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredOCRRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredOCRRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalOCRStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-ocr-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalDocuments: this.documentCount(),
      totalResults: this.resultCount(),
      ocrEngineImplementedCount: 0,
      pdfOcrImplementedCount: 0,
      imageOcrImplementedCount: 0,
      documentRecognitionImplementedCount: 0,
      textExtractionImplementedCount: 0,
      barcodeRecognitionImplementedCount: 0,
      qrRecognitionImplementedCount: 0,
      layoutAnalysisImplementedCount: 0,
      tableRecognitionImplementedCount: 0,
      handwritingRecognitionImplementedCount: 0,
      multiEngineImplementedCount: 0,
      confidenceScoreImplementedCount: 0,
      languageDetectionImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `OCR Runtime store ready (${this.sessionCount()} sessions, ${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.documentCount()} documents, ${this.resultCount()} results).`,
    };
  }
}
