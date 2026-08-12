/**
 * RealTissAutoFillRuntimeAdapter — A4-02.
 *
 * Adapter real de Enrichment (Auto-Fill Runtime) para TISS.
 * Delega operações estruturais ao DefaultAutoFillRuntimeAdapter e executa
 * o preenchimento/identificação do guia TISS sobre a sessão canônica.
 *
 * Sem alterar AutoFillRuntimePort, EnterpriseRuntime, Runtime, Queue,
 * Worker, Scheduler, Retry, Dead Letter, Observability, Pipeline ou
 * Foundations.
 */
import {
  createAutoFillGuideId,
  createAutoFillId,
  createAutoFillIssueId,
  createAutoFillResultId,
  createAutoFillRuntimeRequestId,
} from "../ports/identity";
import type {
  AutoFillField,
  AutoFillGuide,
  AutoFillIssue,
  AutoFillResult,
  AutoFillSession,
  AutoFillStatus,
  CanonicalOperator,
  ValidationResult,
} from "../ports/canonical";
import type { AutoFillRuntimePort } from "../ports/auto-fill-runtime-port";
import type {
  AutoFillRuntimeCapabilities,
  AutoFillRuntimeEnterpriseDeps,
  AutoFillRuntimeHealth,
  AutoFillRuntimeInfo,
  AutoFillRuntimeProviderId,
  AutoFillStatsInput,
  AutoFillStatsResult,
  GetAutoFillResultInput,
  GetAutoFillResultResult,
  PrepareAutoFillInput,
  PrepareAutoFillResult,
} from "../ports/types";
import {
  DefaultAutoFillRuntimeAdapter,
  type DefaultAutoFillRuntimeAdapterOptions,
} from "./default-auto-fill-runtime-adapter";
import type { AutoFillRuntimeStore } from "../store";

export const REAL_TISS_AUTO_FILL_RUNTIME_ADAPTER_ID = "real-tiss-auto-fill-runtime";
export const REAL_TISS_AUTO_FILL_RUNTIME_VERSION = "1.0.0";

export type TissAutoFillEngine = (
  input: PrepareAutoFillInput,
  session: AutoFillSession | undefined,
) => { result: AutoFillResult; session: AutoFillSession };

export type RealTissAutoFillRuntimeAdapterOptions = {
  store?: AutoFillRuntimeStore;
  enterpriseDeps?: AutoFillRuntimeEnterpriseDeps;
  tissAutoFillEngine?: TissAutoFillEngine;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  failAttempts?: number;
};

const DEFAULT_GUIDE_TYPE = "consulta";

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function defaultTissAutoFillEngine(
  input: PrepareAutoFillInput,
  session?: AutoFillSession,
): { result: AutoFillResult; session: AutoFillSession } {
  const stamp = nowIso();
  const autoFillId = session?.autoFillId ?? input.autoFillId ?? createAutoFillId();
  const guideType = input.guideType ?? session?.guideType ?? DEFAULT_GUIDE_TYPE;
  const validationResult = input.validationResult ?? session?.validationResult;

  const issues: AutoFillIssue[] = [];
  const operator = (input.operator ?? session?.operator) as CanonicalOperator | undefined;

  if (validationResult && validationResult.status === "rejected") {
    issues.push({
      kind: "canonical-auto-fill-issue",
      issueId: createAutoFillIssueId(),
      code: "REAL_TISS_ENRICHMENT_VALIDATION_REJECTED",
      severity: "error",
      message: "Validation result rejected — enrichment blocked.",
      status: "failed",
      autoFillEngineImplemented: false,
    });
  }

  const fields: AutoFillField[] = [];
  let status: AutoFillStatus = "populated";

  if (issues.length === 0 && guideType === "consulta") {
    fields.push({
      kind: "canonical-auto-fill-field",
      fieldId: "BENEFICIARIO",
      fieldPath: "dadosBeneficiario.nome",
      label: "Nome do Beneficiário",
      status: "populated",
      fieldPopulationImplemented: false,
      templatePopulationImplemented: false,
    });
    fields.push({
      kind: "canonical-auto-fill-field",
      fieldId: "CARTEIRA",
      fieldPath: "dadosBeneficiario.numeroCarteira",
      label: "Número da Carteira",
      status: "populated",
      fieldPopulationImplemented: false,
      templatePopulationImplemented: false,
    });
    fields.push({
      kind: "canonical-auto-fill-field",
      fieldId: "ATENDIMENTO",
      fieldPath: "dadosAtendimento.data",
      label: "Data do Atendimento",
      status: "populated",
      fieldPopulationImplemented: false,
      templatePopulationImplemented: false,
    });
  } else if (issues.length === 0) {
    issues.push({
      kind: "canonical-auto-fill-issue",
      issueId: createAutoFillIssueId(),
      code: "REAL_TISS_ENRICHMENT_GUIDE_TYPE_NOT_IMPLEMENTED",
      severity: "warning",
      message: `TISS guide type "${guideType}" not implemented for real auto-fill.`,
      status: "pending",
      autoFillEngineImplemented: false,
    });
    status = "pending";
  } else {
    status = "failed";
  }

  const guide: AutoFillGuide = {
    kind: "canonical-auto-fill-guide",
    guideId: session?.guide?.guideId ?? createAutoFillGuideId(),
    guideType,
    operator,
    fields,
    canonicalGuide: input.canonicalGuide ?? session?.canonicalGuide,
    status,
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
  };

  const autoFillContext = input.autoFillContext ?? {
    kind: "canonical-auto-fill-context",
    autoFillId,
    guideType,
    canonicalGuide: input.canonicalGuide,
    mappingResult: input.mappingResult,
    validationResult,
  };

  const updatedSession: AutoFillSession = {
    kind: "canonical-auto-fill-session",
    autoFillId,
    status,
    guide,
    guideType,
    operator: input.operator ?? session?.operator,
    autoFillContext,
    canonicalGuide: input.canonicalGuide ?? session?.canonicalGuide,
    mappingResult: input.mappingResult ?? session?.mappingResult,
    validationResult,
    auditResult: input.auditResult ?? session?.auditResult,
    aiOrchestrationContext: input.aiOrchestrationContext ?? session?.aiOrchestrationContext,
    createdAt: session?.createdAt ?? stamp,
    updatedAt: stamp,
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
  };

  const enrichedResult: AutoFillResult = {
    kind: "canonical-auto-fill-result",
    ok: issues.length === 0,
    resultId: createAutoFillResultId(),
    operation: "prepareAutoFill",
    session: updatedSession,
    guide,
    issues: issues.length > 0 ? issues : undefined,
    autoFillContext,
    canonicalGuide: input.canonicalGuide ?? session?.canonicalGuide,
    mappingResult: input.mappingResult ?? session?.mappingResult,
    validationResult,
    auditResult: input.auditResult ?? session?.auditResult,
    aiOrchestrationContext: input.aiOrchestrationContext ?? session?.aiOrchestrationContext,
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
    runtimeReady: true,
    status,
    messageText:
      issues.length === 0
        ? "TISS auto-fill enrichment completed."
        : "TISS auto-fill enrichment blocked or not implemented.",
    code: issues.length === 0 ? "REAL_TISS_AUTO_FILL_OK" : "REAL_TISS_AUTO_FILL_ISSUES",
    createdAt: session?.createdAt ?? stamp,
    updatedAt: stamp,
  };

  return { result: enrichedResult, session: updatedSession };
}

export class RealTissAutoFillRuntimeAdapter implements AutoFillRuntimePort {
  readonly providerId: Extract<AutoFillRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultAutoFillRuntimeAdapter;
  private readonly tissAutoFillEngine: TissAutoFillEngine;

  constructor(options: RealTissAutoFillRuntimeAdapterOptions = {}) {
    const delegateOptions: DefaultAutoFillRuntimeAdapterOptions = {
      provider: "enterprise",
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs,
      defaultRetryCount: options.defaultRetryCount,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    };
    this.delegate = new DefaultAutoFillRuntimeAdapter(delegateOptions);
    this.tissAutoFillEngine = options.tissAutoFillEngine ?? defaultTissAutoFillEngine;
  }

  capabilities(): AutoFillRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REAL_TISS_AUTO_FILL_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): AutoFillRuntimeInfo {
    const info = this.delegate.providerInfo();
    return {
      ...info,
      providerId: this.providerId,
      metadata: {
        ...info.metadata,
        name: "Real TISS Auto-Fill Runtime",
        version: REAL_TISS_AUTO_FILL_RUNTIME_VERSION,
        vendor: "medicflow-tiss",
        description: "Real TISS auto-fill enrichment (consulta fields).",
      },
    };
  }

  async health(): Promise<AutoFillRuntimeHealth> {
    const h = await this.delegate.health();
    return { ...h, provider: this.providerId };
  }

  async stats(input: AutoFillStatsInput = {}): Promise<AutoFillStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }

  async prepareAutoFill(input: PrepareAutoFillInput): Promise<PrepareAutoFillResult> {
    const res = await this.delegate.prepareAutoFill(input);
    if (!res.ok || !res.session) {
      return { ...res, provider: this.providerId };
    }

    const { result: enrichedResult, session: enrichedSession } = this.tissAutoFillEngine(
      input,
      res.session,
    );

    const store = this.delegate.getStore();
    store.setSession(enrichedSession);
    store.setResult(enrichedResult);

    return {
      ...res,
      ok: enrichedResult.ok,
      provider: this.providerId,
      result: enrichedResult,
      session: enrichedSession,
      message: enrichedResult.messageText,
      code: enrichedResult.code,
    };
  }

  async getResult(input: GetAutoFillResultInput): Promise<GetAutoFillResultResult> {
    const res = await this.delegate.getResult(input);
    if (!res.ok) {
      return { ...res, provider: this.providerId };
    }
    const session =
      res.session ??
      (input.autoFillId ? this.delegate.getStore().getSession(input.autoFillId) : undefined);
    const result =
      res.result ??
      (input.resultId ? this.delegate.getStore().getResult(input.resultId) : undefined);

    if (!result || !session) {
      return { ...res, provider: this.providerId };
    }

    const { result: enrichedResult, session: enrichedSession } = this.tissAutoFillEngine(
      { ...input, guideType: session.guideType, validationResult: session.validationResult },
      session,
    );

    const store = this.delegate.getStore();
    store.setSession(enrichedSession);
    store.setResult(enrichedResult);

    return {
      ...res,
      ok: enrichedResult.ok,
      provider: this.providerId,
      result: enrichedResult,
      session: enrichedSession,
      message: enrichedResult.messageText,
      code: enrichedResult.code,
    };
  }
}
