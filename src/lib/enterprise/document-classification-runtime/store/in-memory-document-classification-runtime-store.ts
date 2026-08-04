/**
 * InMemoryDocumentClassificationRuntimeStore — store in-process oficial (F3-CAP-06 + DIP-04 preservado).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem classificação real). Sessões DIP-04 e jobs/requests/documents/results
 * F3-CAP-06 convivem no mesmo store.
 */
import type { CanonicalClassificationStatistics } from "../ports/canonical";
import type {
  DocumentClassificationRuntimeStore,
  StoredDocumentClassificationRuntimeDocument,
  StoredDocumentClassificationRuntimeJob,
  StoredDocumentClassificationRuntimeRequest,
  StoredDocumentClassificationRuntimeResult,
  StoredDocumentClassificationRuntimeSession,
} from "./document-classification-runtime-store";

export const IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID =
  "in-memory-document-classification-runtime";

export type InMemoryDocumentClassificationRuntimeStoreOptions = {
  sessions?: readonly StoredDocumentClassificationRuntimeSession[];
  jobs?: readonly StoredDocumentClassificationRuntimeJob[];
  requests?: readonly StoredDocumentClassificationRuntimeRequest[];
  documents?: readonly StoredDocumentClassificationRuntimeDocument[];
  results?: readonly StoredDocumentClassificationRuntimeResult[];
};

export class InMemoryDocumentClassificationRuntimeStore implements DocumentClassificationRuntimeStore {
  readonly storeId = IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID;

  private readonly sessions = new Map<string, StoredDocumentClassificationRuntimeSession>();
  private readonly jobs = new Map<string, StoredDocumentClassificationRuntimeJob>();
  private readonly requests = new Map<string, StoredDocumentClassificationRuntimeRequest>();
  private readonly documents = new Map<string, StoredDocumentClassificationRuntimeDocument>();
  private readonly results = new Map<string, StoredDocumentClassificationRuntimeResult>();

  constructor(options: InMemoryDocumentClassificationRuntimeStoreOptions = {}) {
    for (const session of options.sessions ?? []) this.setSession(session);
    for (const job of options.jobs ?? []) this.setJob(job);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const document of options.documents ?? []) this.setDocument(document);
    for (const result of options.results ?? []) this.setResult(result);
  }

  // ---------------------------------------------------------------------
  // DIP-04 — sessões (preservado).
  // ---------------------------------------------------------------------

  getSession(runtimeSessionId: string): StoredDocumentClassificationRuntimeSession | undefined {
    return this.sessions.get(runtimeSessionId);
  }

  setSession(session: StoredDocumentClassificationRuntimeSession): void {
    this.sessions.set(session.runtimeSessionId, session);
  }

  listSessions(): readonly StoredDocumentClassificationRuntimeSession[] {
    return [...this.sessions.values()];
  }

  removeSession(runtimeSessionId: string): boolean {
    return this.sessions.delete(runtimeSessionId);
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  // ---------------------------------------------------------------------
  // F3-CAP-06 — jobs / requests / documents / results estruturais.
  // ---------------------------------------------------------------------

  getJob(jobId: string): StoredDocumentClassificationRuntimeJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredDocumentClassificationRuntimeJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  removeJob(jobId: string): void {
    this.jobs.delete(jobId);
  }

  listJobs(): readonly StoredDocumentClassificationRuntimeJob[] {
    return Array.from(this.jobs.values()).map((job) => ({ ...job }));
  }

  jobCount(): number {
    return this.jobs.size;
  }

  getRequest(requestId: string): StoredDocumentClassificationRuntimeRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredDocumentClassificationRuntimeRequest): void {
    this.requests.set(request.requestId, { ...request });
  }

  listRequests(jobId?: string): readonly StoredDocumentClassificationRuntimeRequest[] {
    const all = Array.from(this.requests.values()).map((request) => ({ ...request }));
    if (!jobId) return all;
    return all.filter((request) => request.jobId === jobId);
  }

  requestCount(): number {
    return this.requests.size;
  }

  getDocument(documentId: string): StoredDocumentClassificationRuntimeDocument | undefined {
    const document = this.documents.get(documentId);
    return document ? { ...document } : undefined;
  }

  setDocument(document: StoredDocumentClassificationRuntimeDocument): void {
    this.documents.set(document.documentId, { ...document });
  }

  listDocuments(jobId?: string): readonly StoredDocumentClassificationRuntimeDocument[] {
    const all = Array.from(this.documents.values()).map((document) => ({ ...document }));
    if (!jobId) return all;
    return all.filter((document) => document.jobId === jobId);
  }

  documentCount(): number {
    return this.documents.size;
  }

  getResult(resultId: string): StoredDocumentClassificationRuntimeResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredDocumentClassificationRuntimeResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredDocumentClassificationRuntimeResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  statistics(): CanonicalClassificationStatistics {
    const jobs = this.listJobs();
    let openJobs = 0;
    let closedJobs = 0;
    for (const job of jobs) {
      if (job.status === "job-open") openJobs += 1;
      if (job.status === "job-closed") closedJobs += 1;
    }
    return {
      kind: "canonical-classification-statistics",
      totalJobs: jobs.length,
      openJobs,
      closedJobs,
      totalRequests: this.requestCount(),
      totalDocuments: this.documentCount(),
      totalResults: this.resultCount(),
      classificationImplementedCount: 0,
      documentRecognitionImplementedCount: 0,
      templateRecognitionImplementedCount: 0,
      medicalGuideRecognitionImplementedCount: 0,
      documentCategoryImplementedCount: 0,
      automaticRoutingImplementedCount: 0,
      confidenceScoreImplementedCount: 0,
      multiClassifierImplementedCount: 0,
      layoutClassificationImplementedCount: 0,
      semanticClassificationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Document Classification Runtime store ready (${this.sessionCount()} sessions, ${this.jobCount()} jobs, ${this.requestCount()} requests, ${this.documentCount()} documents, ${this.resultCount()} results).`,
    };
  }
}
