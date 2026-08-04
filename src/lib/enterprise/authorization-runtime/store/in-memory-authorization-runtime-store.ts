/**
 * InMemoryAuthorizationRuntimeStore — store in-process oficial (C-05).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations,
 * sem autorização funcional, sem integração com operadoras).
 */
import type { AuthorizationStatistics } from "../ports/canonical";
import type {
  AuthorizationRuntimeStore,
  StoredAuthorizationContext,
  StoredAuthorizationPolicy,
  StoredAuthorizationRequest,
  StoredAuthorizationResponse,
  StoredAuthorizationStrategy,
} from "./authorization-runtime-store";

export const IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID = "in-memory-authorization-runtime";

export type InMemoryAuthorizationRuntimeStoreOptions = {
  responses?: readonly StoredAuthorizationResponse[];
  strategies?: readonly StoredAuthorizationStrategy[];
  policies?: readonly StoredAuthorizationPolicy[];
  requests?: readonly StoredAuthorizationRequest[];
  contexts?: readonly StoredAuthorizationContext[];
};

export class InMemoryAuthorizationRuntimeStore implements AuthorizationRuntimeStore {
  readonly storeId = IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID;

  private readonly responses = new Map<string, StoredAuthorizationResponse>();
  private readonly strategies = new Map<string, StoredAuthorizationStrategy>();
  private readonly policies = new Map<string, StoredAuthorizationPolicy>();
  private readonly requests = new Map<string, StoredAuthorizationRequest>();
  private readonly contexts = new Map<string, StoredAuthorizationContext>();

  constructor(options: InMemoryAuthorizationRuntimeStoreOptions = {}) {
    for (const response of options.responses ?? []) this.setResponse(response);
    for (const strategy of options.strategies ?? []) this.setStrategy(strategy);
    for (const policy of options.policies ?? []) this.setPolicy(policy);
    for (const request of options.requests ?? []) this.setRequest(request);
    for (const context of options.contexts ?? []) this.setContext(context);
  }

  getResponse(responseId: string): StoredAuthorizationResponse | undefined {
    const response = this.responses.get(responseId);
    return response ? { ...response } : undefined;
  }

  setResponse(response: StoredAuthorizationResponse): void {
    this.responses.set(response.responseId, { ...response });
  }

  listResponses(): readonly StoredAuthorizationResponse[] {
    return Array.from(this.responses.values()).map((response) => ({ ...response }));
  }

  responseCount(): number {
    return this.responses.size;
  }

  getStrategy(strategyId: string): StoredAuthorizationStrategy | undefined {
    const strategy = this.strategies.get(strategyId);
    return strategy ? { ...strategy } : undefined;
  }

  setStrategy(strategy: StoredAuthorizationStrategy): void {
    const key = strategy.strategyId ?? `strategy-${this.strategies.size + 1}`;
    this.strategies.set(key, { ...strategy });
  }

  listStrategies(): readonly StoredAuthorizationStrategy[] {
    return Array.from(this.strategies.values()).map((strategy) => ({ ...strategy }));
  }

  strategyCount(): number {
    return this.strategies.size;
  }

  getPolicy(policyId: string): StoredAuthorizationPolicy | undefined {
    const policy = this.policies.get(policyId);
    return policy ? { ...policy } : undefined;
  }

  setPolicy(policy: StoredAuthorizationPolicy): void {
    const key = policy.policyId ?? `policy-${this.policies.size + 1}`;
    this.policies.set(key, { ...policy });
  }

  listPolicies(): readonly StoredAuthorizationPolicy[] {
    return Array.from(this.policies.values()).map((policy) => ({ ...policy }));
  }

  policyCount(): number {
    return this.policies.size;
  }

  getRequest(requestId: string): StoredAuthorizationRequest | undefined {
    const request = this.requests.get(requestId);
    return request ? { ...request } : undefined;
  }

  setRequest(request: StoredAuthorizationRequest): void {
    const key = request.requestId ?? `req-${this.requests.size + 1}`;
    this.requests.set(key, { ...request });
  }

  listRequests(): readonly StoredAuthorizationRequest[] {
    return Array.from(this.requests.values()).map((request) => ({ ...request }));
  }

  requestCount(): number {
    return this.requests.size;
  }

  getContext(contextId: string): StoredAuthorizationContext | undefined {
    const context = this.contexts.get(contextId);
    return context ? { ...context } : undefined;
  }

  setContext(context: StoredAuthorizationContext): void {
    const key =
      context.contextId ??
      context.requestId ??
      context.responseId ??
      context.strategyId ??
      context.policyId ??
      `ctx-${this.contexts.size + 1}`;
    this.contexts.set(key, { ...context });
  }

  listContexts(): readonly StoredAuthorizationContext[] {
    return Array.from(this.contexts.values()).map((context) => ({ ...context }));
  }

  contextCount(): number {
    return this.contexts.size;
  }

  statistics(): AuthorizationStatistics {
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
      kind: "canonical-authorization-statistics",
      totalStrategies: this.strategyCount(),
      totalPolicies: this.policyCount(),
      totalResponses: all.length,
      completedResponses: completed,
      failedResponses: failed,
      cancelledResponses: cancelled,
      preparedResponses: prepared,
      totalRequests: this.requestCount(),
      totalContexts: this.contextCount(),
      authorizationExecutedCount: 0,
      eligibilityExecutedCount: 0,
      communicationExecutedCount: 0,
      authorizationImplementedCount: 0,
      eligibilityImplementedCount: 0,
      attachmentAuthorizationImplementedCount: 0,
      batchAuthorizationImplementedCount: 0,
      statusPollingImplementedCount: 0,
      preAuthorizationImplementedCount: 0,
      soapFunctionalImplementedCount: 0,
      xmlFunctionalImplementedCount: 0,
      restImplementedCount: 0,
      operatorCommunicationImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Authorization Runtime store ready (${this.strategyCount()} strategies, ${this.policyCount()} policies, ${this.responseCount()} responses, ${this.requestCount()} requests, ${this.contextCount()} contexts).`,
    };
  }
}
