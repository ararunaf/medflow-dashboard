/**
 * RealTissValidationRuntimeAdapter — A3-02.
 *
 * Adapter real do Enterprise Validation Runtime (F3-CAP-08).
 * Implementa `ValidationRuntimePort` reutilizando `DefaultValidationRuntimeAdapter`
 * como delegate e executa validação sobre `DocumentExtractionResult`.
 *
 * Sem alterar o Port, Runtime, Pipeline, Queue, Worker, Scheduler, Retry,
 * Dead Letter, Observability ou Foundations.
 */
import type {
  DocumentClassificationContext,
  DocumentExtractionResult,
  ExtractionField,
} from "../../document-extraction-runtime/ports/canonical";
import { DefaultValidationRuntimeAdapter } from "./default-validation-runtime-adapter";
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import { createValidationResultId } from "../ports/identity";
import type {
  CloseValidationJobInput,
  CloseValidationJobResult,
  GetValidationResultInput,
  GetValidationResultResult,
  OpenValidationJobInput,
  OpenValidationJobResult,
  RegisterValidationDocumentInput,
  RegisterValidationDocumentResult,
  SubmitValidationRequestInput,
  SubmitValidationRequestResult,
  ValidationRuntimeCapabilities,
  ValidationRuntimeEnterpriseDeps,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
  ValidationRuntimeProviderId,
  ValidationStatsInput,
  ValidationStatsResult,
} from "../ports/types";
import type {
  ValidationContext,
  ValidationIssue,
  ValidationResult,
  ValidationStatus,
  ValidationSummary,
  ValidationWarning,
} from "../ports/canonical";
import type { ValidationRuntimeStore } from "../store";
import { InMemoryValidationRuntimeStore } from "../store";

export const REAL_TISS_VALIDATION_RUNTIME_ADAPTER_ID = "real-tiss-validation-runtime";
export const REAL_TISS_VALIDATION_RUNTIME_VERSION = "1.0.0";

export type TissValidator = (
  extractionResult: DocumentExtractionResult | undefined,
  classificationContext?: DocumentClassificationContext,
) => { result: Partial<ValidationResult>; status: ValidationStatus };

export type RealTissValidationRuntimeAdapterOptions = {
  provider?: ValidationRuntimeProviderId;
  store?: ValidationRuntimeStore;
  enterpriseDeps?: ValidationRuntimeEnterpriseDeps;
  tissValidator?: TissValidator;
};

function defaultTissValidator(
  extractionResult: DocumentExtractionResult | undefined,
  classificationContext?: DocumentClassificationContext,
): { result: Partial<ValidationResult>; status: ValidationStatus } {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];

  if (!extractionResult) {
    issues.push({
      kind: "canonical-validation-issue",
      issueId: createValidationResultId(),
      code: "REAL_TISS_VALIDATION_NO_EXTRACTION",
      message: "DocumentExtractionResult não encontrado para validação.",
      severity: "error",
      status: "failed",
      fieldValidationImplemented: false,
      documentValidationImplemented: false,
      businessRuleValidationImplemented: false,
    });
  } else {
    for (const field of extractionResult.fields ?? []) {
      if (field.status === "failed") {
        issues.push(buildFieldIssue(field, "error", "Campo ausente/inválido"));
      } else if (field.status === "unknown") {
        warnings.push(buildFieldWarning(field, "Campo com status desconhecido"));
      } else if (field.status === "processed") {
        if (field.value === undefined || field.value === null || field.value === "") {
          issues.push(buildFieldIssue(field, "error", "Campo processado sem valor"));
        }
      }
    }

    const guideType =
      classificationContext?.guideType ?? extractionResult.classificationContext?.guideType;
    if (!guideType || guideType === "unknown") {
      warnings.push({
        kind: "canonical-validation-warning",
        warningId: createValidationResultId(),
        code: "REAL_TISS_VALIDATION_UNKNOWN_GUIDE_TYPE",
        message: "Tipo de guia desconhecido — validação limitada.",
        status: "unknown",
        qualityValidationImplemented: false,
        confidenceValidationImplemented: false,
      });
    }
  }

  const errorCount = issues.length;
  const warningCount = warnings.length;
  const issueCount = errorCount + warningCount;

  let status: ValidationStatus;
  if (errorCount > 0) {
    status = "rejected";
  } else if (warningCount > 0) {
    status = "pending-review";
  } else {
    status = "validated";
  }

  const summary: ValidationSummary = {
    kind: "canonical-validation-summary",
    issueCount,
    warningCount,
    errorCount,
    status,
    validationContext: buildValidationContext(extractionResult, classificationContext),
    fieldValidationImplemented: false,
    documentValidationImplemented: false,
    templateValidationImplemented: false,
    operatorValidationImplemented: false,
    tissValidationImplemented: false,
    automaticApprovalImplemented: false,
    automaticRejectionImplemented: false,
  };

  return {
    result: {
      issues,
      warnings,
      summary,
      status,
      code: errorCount > 0 ? "REAL_TISS_VALIDATION_REJECTED" : "REAL_TISS_VALIDATION_OK",
      messageText:
        errorCount > 0
          ? `Validação TISS rejeitou ${errorCount} campo(s) com erro.`
          : warningCount > 0
            ? `Validação TISS concluída com ${warningCount} aviso(s).`
            : "Validação TISS concluída com sucesso.",
      validationContext: buildValidationContext(extractionResult, classificationContext),
    },
    status,
  };
}

function buildValidationContext(
  extractionResult?: DocumentExtractionResult,
  classificationContext?: DocumentClassificationContext,
): ValidationContext {
  return {
    kind: "canonical-validation-context",
    classificationContext,
    extractionResult,
    confidence: {
      kind: "canonical-validation-confidence",
      score: 1,
      band: extractionResult ? "high" : "unknown",
    },
    futureRules: {
      kind: "canonical-future-validation-rule-contracts",
      templateMatchesOperatorDeclared: false,
      tissVersionCompatibleDeclared: false,
      documentCompatibleWithTemplateDeclared: false,
      minimumQualityDeclared: false,
      minimumConfidenceDeclared: false,
      mandatoryFieldsDeclared: false,
      crossFieldConsistencyDeclared: false,
      guideOperatorCompatibilityDeclared: false,
      documentConsistencyDeclared: false,
      overallValidationScoreDeclared: false,
    },
  };
}

function buildFieldIssue(
  field: ExtractionField,
  severity: "error" | "warning" | "info",
  message: string,
): ValidationIssue {
  return {
    kind: "canonical-validation-issue",
    issueId: createValidationResultId(),
    code: `REAL_TISS_VALIDATION_${field.status.toUpperCase()}_FIELD`,
    message: `${message}: ${field.fieldName ?? field.fieldId}`,
    fieldPath: field.fieldPath ?? field.fieldId,
    severity,
    status: "failed",
    fieldValidationImplemented: false,
    documentValidationImplemented: false,
    businessRuleValidationImplemented: false,
  };
}

function buildFieldWarning(field: ExtractionField, message: string): ValidationWarning {
  return {
    kind: "canonical-validation-warning",
    warningId: createValidationResultId(),
    code: `REAL_TISS_VALIDATION_${field.status.toUpperCase()}_FIELD`,
    message: `${message}: ${field.fieldName ?? field.fieldId}`,
    fieldPath: field.fieldPath ?? field.fieldId,
    status: "unknown",
    qualityValidationImplemented: false,
    confidenceValidationImplemented: false,
  };
}

export class RealTissValidationRuntimeAdapter implements ValidationRuntimePort {
  readonly providerId: Extract<ValidationRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultValidationRuntimeAdapter;
  private readonly enterpriseDeps: ValidationRuntimeEnterpriseDeps;
  private readonly tissValidator: TissValidator;

  constructor(options: RealTissValidationRuntimeAdapterOptions = {}) {
    this.enterpriseDeps = options.enterpriseDeps ?? {};
    this.tissValidator = options.tissValidator ?? defaultTissValidator;
    this.delegate = new DefaultValidationRuntimeAdapter({
      provider: "enterprise",
      store: options.store ?? new InMemoryValidationRuntimeStore(),
      enterpriseDeps: this.enterpriseDeps,
    });
  }

  async health(): Promise<ValidationRuntimeHealth> {
    const health = await this.delegate.health();
    return { ...health, provider: this.providerId };
  }

  capabilities(): ValidationRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return { ...caps, provider: this.providerId };
  }

  providerInfo(): ValidationRuntimeInfo {
    const info = this.delegate.providerInfo();
    return { ...info, providerId: this.providerId };
  }

  async openJob(input: OpenValidationJobInput): Promise<OpenValidationJobResult> {
    const res = await this.delegate.openJob(input);
    return { ...res, provider: this.providerId };
  }

  async closeJob(input: CloseValidationJobInput): Promise<CloseValidationJobResult> {
    const res = await this.delegate.closeJob(input);
    return { ...res, provider: this.providerId };
  }

  async submitRequest(input: SubmitValidationRequestInput): Promise<SubmitValidationRequestResult> {
    let extractionResult: DocumentExtractionResult | undefined;
    let classificationContext: DocumentClassificationContext | undefined;

    if (
      input.documentId &&
      typeof this.enterpriseDeps.getDocumentExtractionRuntimePort === "function"
    ) {
      try {
        const extraction = await this.enterpriseDeps
          .getDocumentExtractionRuntimePort()
          .getResult({ documentId: input.documentId });
        if (extraction.ok) {
          extractionResult = extraction.result;
          classificationContext =
            extraction.result?.classificationContext ?? input.classificationContext;
        }
      } catch {
        // best-effort; getResult pode lidar sem extração
      }
    }

    const submitInput: SubmitValidationRequestInput = {
      ...input,
      extractionResult: extractionResult ?? input.extractionResult,
      classificationContext: classificationContext ?? input.classificationContext,
      validationContext: buildValidationContext(
        extractionResult,
        classificationContext ?? input.classificationContext,
      ),
    };

    const res = await this.delegate.submitRequest(submitInput);
    return { ...res, provider: this.providerId };
  }

  async registerDocument(
    input: RegisterValidationDocumentInput,
  ): Promise<RegisterValidationDocumentResult> {
    const res = await this.delegate.registerDocument(input);
    return { ...res, provider: this.providerId };
  }

  async getResult(input: GetValidationResultInput): Promise<GetValidationResultResult> {
    const res = await this.delegate.getResult(input);
    if (!res.ok || !res.result) {
      return { ...res, provider: this.providerId };
    }

    const extractionResult = res.request?.extractionResult ?? res.result.extractionResult;
    const classificationContext =
      res.request?.classificationContext ?? res.result.classificationContext;
    const { result: validation, status } = this.tissValidator(
      extractionResult,
      classificationContext,
    );

    const updatedResult: ValidationResult = {
      ...res.result,
      ...validation,
      ok: status !== "rejected",
      extractionResult,
      classificationContext,
    };

    return {
      ...res,
      provider: this.providerId,
      result: updatedResult,
    };
  }

  async stats(input: ValidationStatsInput = {}): Promise<ValidationStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }
}
