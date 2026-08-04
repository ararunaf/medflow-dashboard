/**
 * InMemoryXMLValidationRuntimeStore — store in-process oficial (C-02).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem validação XML funcional).
 */
import type { XMLValidationStatistics } from "../ports/canonical";
import type {
  StoredXMLValidationContext,
  StoredXMLValidationRequest,
  StoredXMLValidationResult,
  XMLValidationRuntimeStore,
} from "./xml-validation-runtime-store";

export const IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID = "in-memory-xml-validation-runtime";

export type InMemoryXMLValidationRuntimeStoreOptions = {
  results?: readonly StoredXMLValidationResult[];
  requests?: readonly StoredXMLValidationRequest[];
  contexts?: readonly StoredXMLValidationContext[];
};

export class InMemoryXMLValidationRuntimeStore implements XMLValidationRuntimeStore {
  readonly storeId = IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID;

  private readonly results = new Map<string, StoredXMLValidationResult>();
  private readonly requests = new Map<string, StoredXMLValidationRequest>();
  private readonly contexts = new Map<string, StoredXMLValidationContext>();

  constructor(options: InMemoryXMLValidationRuntimeStoreOptions = {}) {
    for (const result of options.results ?? []) this.setResult(result);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const context of options.contexts ?? []) this.setContext(context);
  }

  getResult(resultId: string): StoredXMLValidationResult | undefined {
    const result = this.results.get(resultId);
    return result ? { ...result } : undefined;
  }

  setResult(result: StoredXMLValidationResult): void {
    this.results.set(result.resultId, { ...result });
  }

  listResults(): readonly StoredXMLValidationResult[] {
    return Array.from(this.results.values()).map((result) => ({ ...result }));
  }

  resultCount(): number {
    return this.results.size;
  }

  getRequest(requestId: string): StoredXMLValidationRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredXMLValidationRequest): void {
    const key = request.requestId ?? request.validationId ?? `req-${this.requests.size + 1}`;
    this.requests.set(key, { ...request });
  }

  listRequests(): readonly StoredXMLValidationRequest[] {
    return Array.from(this.requests.values()).map((request) => ({ ...request }));
  }

  requestCount(): number {
    return this.requests.size;
  }

  getContext(documentId: string): StoredXMLValidationContext | undefined {
    const context = this.contexts.get(documentId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredXMLValidationContext): void {
    const key = context.documentId ?? context.resultId ?? `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredXMLValidationContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  statistics(): XMLValidationStatistics {
    const all = this.listResults();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let validated = 0;
    for (const result of all) {
      if (result.status === "completed" || result.status === "validated") completed += 1;
      if (result.status === "validated") validated += 1;
      if (result.status === "failed") failed += 1;
      if (result.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-xml-validation-statistics",
      totalResults: all.length,
      completedResults: completed,
      failedResults: failed,
      cancelledResults: cancelled,
      validatedResults: validated,
      totalRequests: this.requestCount(),
      totalContexts: this.contextCount(),
      validationExecutedCount: 0,
      realValidationPerformedCount: 0,
      officialXsdLoadedCount: 0,
      officialAnsValidationCount: 0,
      officialTissValidationCount: 0,
      validationRulesLoadedCount: 0,
      xmlValidationImplementedCount: 0,
      xsdValidationImplementedCount: 0,
      namespaceValidationImplementedCount: 0,
      schemaSelectionImplementedCount: 0,
      versionValidationImplementedCount: 0,
      businessValidationImplementedCount: 0,
      operatorValidationImplementedCount: 0,
      xmlRepairImplementedCount: 0,
      automaticCorrectionImplementedCount: 0,
      validationReportImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `XML Validation Runtime store ready (${this.resultCount()} results, ${this.requestCount()} requests, ${this.contextCount()} contexts).`,
    };
  }
}
