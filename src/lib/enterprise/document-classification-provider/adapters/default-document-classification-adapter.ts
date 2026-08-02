/**
 * DefaultDocumentClassificationAdapter — CLASS-01.
 *
 * Adapter oficial rule-based (também exportado como RuleBasedDocumentClassificationAdapter).
 * Sem IA. Sem ML. Sem embeddings. Sem HTTP. Sem OCR novo.
 * Consome exclusivamente texto/estrutura do OCR Runtime.
 *
 * Implementa: timeout, retry, cancelamento, logging estrutural, telemetria estrutural.
 */
import { DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES } from "../ports/capabilities";
import { createDocumentClassificationRequestId } from "../ports/identity";
import type { DocumentClassificationProviderPort } from "../ports/document-classification-provider-port";
import { DEFAULT_DOCUMENT_CLASSIFICATION_RULES } from "../ports/rules";
import type {
  DocumentClassificationConfigurationValidation,
  DocumentClassificationProcessInput,
  DocumentClassificationProcessResult,
  DocumentClassificationProviderHealth,
  DocumentClassificationProviderId,
  DocumentClassificationProviderInfo,
  DocumentClassificationProviderMetadata,
  DocumentClassificationProviderPortCapabilities,
  DocumentClassificationRule,
  DocumentClassificationStructuredLog,
  DocumentClassificationType,
} from "../ports/types";

export const DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID = "default-rule-based";
export const DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION = "1.0.0";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultDocumentClassificationAdapterOptions = {
  provider?: Extract<DocumentClassificationProviderId, "rule-based" | "default">;
  healthy?: boolean;
  message?: string;
  rules?: readonly DocumentClassificationRule[];
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry). */
  failAttempts?: number;
};

function readSignal(input: DocumentClassificationProcessInput): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

function extractOcrText(input: DocumentClassificationProcessInput): string {
  if (typeof input.ocrText === "string" && input.ocrText.trim()) {
    return input.ocrText;
  }
  const structured = input.ocrStructuredData ?? {};
  const candidates = [
    structured.extractedText,
    structured.fullText,
    structured.text,
    structured.content,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  const attrText = input.attributes?.ocrText;
  if (typeof attrText === "string" && attrText.trim()) return attrText;
  return "";
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function classifyByRules(
  text: string,
  rules: readonly DocumentClassificationRule[],
): {
  documentType: DocumentClassificationType;
  confidence: number;
  matchedRules: string[];
} {
  if (!text.trim()) {
    return {
      documentType: "documento-desconhecido",
      confidence: 0,
      matchedRules: [],
    };
  }

  const haystack = normalize(text);
  let bestType: DocumentClassificationType = "documento-desconhecido";
  let bestScore = 0;
  const matched: string[] = [];

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    let hits = 0;
    for (const keyword of rule.keywords) {
      if (haystack.includes(normalize(keyword))) hits += 1;
    }
    if (hits === 0) continue;
    matched.push(rule.id);
    const score = hits * weight;
    if (score > bestScore) {
      bestScore = score;
      bestType = rule.documentType;
    }
  }

  if (bestType === "documento-desconhecido") {
    return { documentType: bestType, confidence: 0.1, matchedRules: [] };
  }

  const confidence = Math.min(0.99, 0.55 + matched.length * 0.1 + Math.min(bestScore, 100) / 500);
  return { documentType: bestType, confidence, matchedRules: matched };
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adapter oficial CLASS-01 — classificação documental rule-based.
 */
export class DefaultDocumentClassificationAdapter implements DocumentClassificationProviderPort {
  readonly providerId: Extract<DocumentClassificationProviderId, "rule-based" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly rules: readonly DocumentClassificationRule[];
  private readonly metadata: DocumentClassificationProviderMetadata;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;

  constructor(options: DefaultDocumentClassificationAdapterOptions = {}) {
    this.providerId = options.provider ?? "rule-based";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} document classification provider ready (rule-based, no AI).`;
    this.rules = options.rules ?? DEFAULT_DOCUMENT_CLASSIFICATION_RULES;
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Document Classification Provider"
          : "Rule-Based Document Classification Provider",
      version: DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official CLASS-01 rule-based document classifier — no AI, no ML, no embeddings, no HTTP.",
    };
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;
  }

  capabilities(): DocumentClassificationProviderPortCapabilities {
    return {
      provider: this.providerId,
      adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
      classification: { ...DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES },
      supportsCanonicalResult: true,
      supportsOcrRuntimeInput: true,
      supportsConfigurableRules: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsEmbeddings: false,
      implementsLlm: false,
    };
  }

  providerInfo(): DocumentClassificationProviderInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_CLASSIFICATION",
      capabilities: { ...DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentClassificationProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      status: this.healthy ? "ready" : "unhealthy",
      message: this.message,
    };
  }

  async validateConfiguration(): Promise<DocumentClassificationConfigurationValidation> {
    if (this.rules.length === 0) {
      return {
        ok: false,
        provider: this.providerId,
        errors: ["Nenhuma regra de classificação configurada."],
        warnings: [],
        message: "Ruleset vazio.",
      };
    }
    return {
      ok: true,
      provider: this.providerId,
      errors: [],
      warnings: [],
      message: `Rule-based classification ready (${this.rules.length} rules).`,
    };
  }

  async classify(
    input: DocumentClassificationProcessInput,
  ): Promise<DocumentClassificationProcessResult> {
    const requestId = input.requestId ?? createDocumentClassificationRequestId();
    const startedMs = Date.now();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(
      input.timeoutMs ?? input.attributes?.timeoutMs,
      this.defaultTimeoutMs,
    );
    const retryCount = readPositiveInt(
      input.retryCount ?? input.attributes?.retryCount,
      this.defaultRetryCount,
    );
    const retryBackoffMs = readPositiveInt(
      input.attributes?.retryBackoffMs,
      this.defaultRetryBackoffMs,
    );
    const rules = input.rules ?? this.rules;
    const logs: DocumentClassificationStructuredLog[] = [];

    const fail = (
      message: string,
      code: string,
      attempts: number,
    ): DocumentClassificationProcessResult => {
      logs.push({
        level: "error",
        code,
        message,
        requestId,
        providerId: this.providerId,
        attempt: attempts,
      });
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        documentType: "documento-desconhecido",
        confidence: 0,
        matchedRules: [],
        message,
        code,
        simulated: false,
        telemetry: {
          latencyMs: Math.max(0, Date.now() - startedMs),
          attempts,
          cancelled: signal?.aborted === true,
          matchedRuleCount: 0,
          documentType: "documento-desconhecido",
        },
        logs,
      };
    };

    if (!this.healthy) {
      return fail("Document classification provider unhealthy.", "CLASSIFICATION_UNHEALTHY", 0);
    }

    if (signal?.aborted) {
      return fail("Classificação cancelada antes do início.", "CLASSIFICATION_CANCELLED", 0);
    }

    const maxAttempts = retryCount + 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        return fail("Classificação cancelada.", "CLASSIFICATION_CANCELLED", attempt);
      }

      try {
        const outcome = await this.withTimeout(
          this.executeClassification(input, rules, requestId, attempt, logs),
          timeoutMs,
          signal,
        );

        logs.push({
          level: "info",
          code: "CLASSIFICATION_OK",
          message: `Classified as ${outcome.documentType}`,
          requestId,
          providerId: this.providerId,
          attempt,
        });

        return {
          ok: true,
          requestId,
          provider: this.providerId,
          documentType: outcome.documentType,
          confidence: outcome.confidence,
          matchedRules: outcome.matchedRules,
          message: `Rule-based classification completed (${outcome.documentType}).`,
          code: "CLASSIFIED",
          simulated: false,
          telemetry: {
            latencyMs: Math.max(0, Date.now() - startedMs),
            attempts: attempt,
            cancelled: false,
            matchedRuleCount: outcome.matchedRules.length,
            documentType: outcome.documentType,
          },
          logs,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (signal?.aborted || /cancel/i.test(lastError)) {
          return fail(lastError, "CLASSIFICATION_CANCELLED", attempt);
        }
        if (/timeout/i.test(lastError)) {
          return fail(lastError, "CLASSIFICATION_TIMEOUT", attempt);
        }
        logs.push({
          level: "warn",
          code: "CLASSIFICATION_RETRY",
          message: lastError,
          requestId,
          providerId: this.providerId,
          attempt,
        });
        if (attempt < maxAttempts) {
          await this.sleep(retryBackoffMs * attempt);
          continue;
        }
      }
    }

    return fail(
      lastError ?? "Classificação falhou após retries.",
      "CLASSIFICATION_FAILED",
      maxAttempts,
    );
  }

  private async executeClassification(
    input: DocumentClassificationProcessInput,
    rules: readonly DocumentClassificationRule[],
    requestId: string,
    attempt: number,
    logs: DocumentClassificationStructuredLog[],
  ): Promise<{
    documentType: DocumentClassificationType;
    confidence: number;
    matchedRules: string[];
  }> {
    if (this.failAttemptsRemaining > 0) {
      this.failAttemptsRemaining -= 1;
      throw new Error(
        `Transient classification failure (attempt ${attempt}, request ${requestId}).`,
      );
    }

    // Stamp estrutural — evita unused / prova logging path.
    void this.now();
    logs.push({
      level: "info",
      code: "CLASSIFICATION_START",
      message: "Starting rule-based classification from OCR runtime input.",
      requestId,
      providerId: this.providerId,
      attempt,
    });

    const forceDelayMs = readPositiveInt(input.attributes?.forceDelayMs, 0);
    if (forceDelayMs > 0) {
      await this.sleep(forceDelayMs);
    }

    const text = extractOcrText(input);
    return classifyByRules(text, rules);
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (timeoutMs <= 0) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Classification timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
          if (signal) {
            onAbort = () => reject(new Error("Classification cancelled."));
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter rule-based (CLASS-01). */
export const RuleBasedDocumentClassificationAdapter = DefaultDocumentClassificationAdapter;
