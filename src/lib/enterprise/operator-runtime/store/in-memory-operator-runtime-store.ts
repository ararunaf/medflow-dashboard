/**
 * InMemoryOperatorRuntimeStore — store in-process oficial (C-04).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem operadoras reais).
 */
import type { OperatorStatistics } from "../ports/canonical";
import type {
  OperatorRuntimeStore,
  StoredOperatorContext,
  StoredOperatorProfile,
  StoredOperatorRequest,
  StoredOperatorResponse,
} from "./operator-runtime-store";

export const IN_MEMORY_OPERATOR_RUNTIME_STORE_ID = "in-memory-operator-runtime";

export type InMemoryOperatorRuntimeStoreOptions = {
  responses?: readonly StoredOperatorResponse[];
  profiles?: readonly StoredOperatorProfile[];
  requests?: readonly StoredOperatorRequest[];
  contexts?: readonly StoredOperatorContext[];
};

export class InMemoryOperatorRuntimeStore implements OperatorRuntimeStore {
  readonly storeId = IN_MEMORY_OPERATOR_RUNTIME_STORE_ID;

  private readonly responses = new Map<string, StoredOperatorResponse>();
  private readonly profiles = new Map<string, StoredOperatorProfile>();
  private readonly requests = new Map<string, StoredOperatorRequest>();
  private readonly contexts = new Map<string, StoredOperatorContext>();

  constructor(options: InMemoryOperatorRuntimeStoreOptions = {}) {
    for (const response of options.responses ?? []) this.setResponse(response);
    for (const profile of options.profiles ?? []) this.setProfile(profile);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const context of options.contexts ?? []) this.setContext(context);
  }

  getResponse(responseId: string): StoredOperatorResponse | undefined {
    const response = this.responses.get(responseId);
    return response ? { ...response } : undefined;
  }

  setResponse(response: StoredOperatorResponse): void {
    this.responses.set(response.responseId, { ...response });
  }

  listResponses(): readonly StoredOperatorResponse[] {
    return Array.from(this.responses.values()).map((response) => ({ ...response }));
  }

  responseCount(): number {
    return this.responses.size;
  }

  getProfile(profileId: string): StoredOperatorProfile | undefined {
    const profile = this.profiles.get(profileId);
    return profile ? { ...profile } : undefined;
  }

  setProfile(profile: StoredOperatorProfile): void {
    const key = profile.profileId ?? profile.operatorId ?? `profile-${this.profiles.size + 1}`;
    this.profiles.set(key, { ...profile });
  }

  listProfiles(): readonly StoredOperatorProfile[] {
    return Array.from(this.profiles.values()).map((profile) => ({ ...profile }));
  }

  profileCount(): number {
    return this.profiles.size;
  }

  getRequest(requestId: string): StoredOperatorRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredOperatorRequest): void {
    const key = request.requestId ?? `req-${this.requests.size + 1}`;
    this.requests.set(key, { ...request });
  }

  listRequests(): readonly StoredOperatorRequest[] {
    return Array.from(this.requests.values()).map((request) => ({ ...request }));
  }

  requestCount(): number {
    return this.requests.size;
  }

  getContext(contextId: string): StoredOperatorContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredOperatorContext): void {
    const key =
      context.contextId ??
      context.requestId ??
      context.responseId ??
      context.profileId ??
      `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredOperatorContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  statistics(): OperatorStatistics {
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
      kind: "canonical-operator-statistics",
      totalProfiles: this.profileCount(),
      totalResponses: all.length,
      completedResponses: completed,
      failedResponses: failed,
      cancelledResponses: cancelled,
      preparedResponses: prepared,
      totalRequests: this.requestCount(),
      totalContexts: this.contextCount(),
      realOperatorResolvedCount: 0,
      communicationExecutedCount: 0,
      operatorImplementedCount: 0,
      operatorCapabilityProfileImplementedCount: 0,
      operatorAuthenticationImplementedCount: 0,
      operatorCommunicationImplementedCount: 0,
      soapFunctionalImplementedCount: 0,
      xmlFunctionalImplementedCount: 0,
      restImplementedCount: 0,
      authorizationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Operator Runtime store ready (${this.profileCount()} profiles, ${this.responseCount()} responses, ${this.requestCount()} requests, ${this.contextCount()} contexts).`,
    };
  }
}
