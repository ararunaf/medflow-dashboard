/**
 * InMemorySOAPRuntimeStore — store in-process oficial (C-03).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem comunicação SOAP).
 */
import type { SOAPStatistics } from "../ports/canonical";
import type {
  SOAPRuntimeStore,
  StoredSOAPContext,
  StoredSOAPRequest,
  StoredSOAPResponse,
} from "./soap-runtime-store";

export const IN_MEMORY_SOAP_RUNTIME_STORE_ID = "in-memory-soap-runtime";

export type InMemorySOAPRuntimeStoreOptions = {
  responses?: readonly StoredSOAPResponse[];
  requests?: readonly StoredSOAPRequest[];
  contexts?: readonly StoredSOAPContext[];
};

export class InMemorySOAPRuntimeStore implements SOAPRuntimeStore {
  readonly storeId = IN_MEMORY_SOAP_RUNTIME_STORE_ID;

  private readonly responses = new Map<string, StoredSOAPResponse>();
  private readonly requests = new Map<string, StoredSOAPRequest>();
  private readonly contexts = new Map<string, StoredSOAPContext>();

  constructor(options: InMemorySOAPRuntimeStoreOptions = {}) {
    for (const response of options.responses ?? []) this.setResponse(response);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const context of options.contexts ?? []) this.setContext(context);
  }

  getResponse(responseId: string): StoredSOAPResponse | undefined {
    const response = this.responses.get(responseId);
    return response ? { ...response } : undefined;
  }

  setResponse(response: StoredSOAPResponse): void {
    this.responses.set(response.responseId, { ...response });
  }

  listResponses(): readonly StoredSOAPResponse[] {
    return Array.from(this.responses.values()).map((response) => ({ ...response }));
  }

  responseCount(): number {
    return this.responses.size;
  }

  getRequest(requestId: string): StoredSOAPRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredSOAPRequest): void {
    const key = request.requestId ?? `req-${this.requests.size + 1}`;
    this.requests.set(key, { ...request });
  }

  listRequests(): readonly StoredSOAPRequest[] {
    return Array.from(this.requests.values()).map((request) => ({ ...request }));
  }

  requestCount(): number {
    return this.requests.size;
  }

  getContext(contextId: string): StoredSOAPContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredSOAPContext): void {
    const key =
      context.contextId ??
      context.requestId ??
      context.responseId ??
      `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredSOAPContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  statistics(): SOAPStatistics {
    const all = this.listResponses();
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let prepared = 0;
    for (const response of all) {
      if (response.status === "completed" || response.status === "prepared") completed += 1;
      if (response.status === "prepared") prepared += 1;
      if (response.status === "failed") failed += 1;
      if (response.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-soap-statistics",
      totalResponses: all.length,
      completedResponses: completed,
      failedResponses: failed,
      cancelledResponses: cancelled,
      preparedResponses: prepared,
      totalRequests: this.requestCount(),
      totalContexts: this.contextCount(),
      communicationExecutedCount: 0,
      realCommunicationPerformedCount: 0,
      wsdlLoadedCount: 0,
      certificateUsedCount: 0,
      tlsEstablishedCount: 0,
      soapCommunicationImplementedCount: 0,
      wsdlImplementedCount: 0,
      soapEnvelopeImplementedCount: 0,
      soapFaultImplementedCount: 0,
      certificateImplementedCount: 0,
      tlsImplementedCount: 0,
      mtomImplementedCount: 0,
      compressionImplementedCount: 0,
      retryImplementedCount: 0,
      operatorCommunicationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `SOAP Runtime store ready (${this.responseCount()} responses, ${this.requestCount()} requests, ${this.contextCount()} contexts).`,
    };
  }
}
