/**
 * Server functions — Captura Inteligente (wrapper sobre infraestrutura).
 */
import { createServerFn } from "@tanstack/react-start";
import { createHash } from "node:crypto";
import type { JsonObject } from "@/lib/database.types";
import {
  optionalString,
  requireObject,
  requireString,
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import { decodeBase64ToBytes } from "../infrastructure/base64";
import {
  cancelCaptureSession,
  createCaptureSession,
  getCaptureDocumentSignedUrl,
  getCaptureSession,
  getCaptureSessionStatus,
  retryCaptureDocumentUpload,
  softDeleteCaptureSession,
  uploadCaptureDocument,
} from "../infrastructure/capture-session-store";
import { registerCaptureDocumentIntakeBridge } from "../enterprise/register-capture-intake";
import { runCaptureOperationalPipelineBound } from "../enterprise/capture-runtime-binding";
import { getCaptureOcrResult, runCaptureOcr } from "../ocr/services/ocr-service";
import { getOcrResultSignedUrl } from "../ocr/infrastructure/ocr-storage";
import {
  getCaptureStructuredGuide,
  runCaptureParser,
} from "../parser/services/tiss-parser-service";
import { getStructuredGuideSignedUrl } from "../parser/infrastructure/parser-storage";
import { getCaptureAuditReport, runCaptureAudit } from "../audit/services/preventive-audit-service";
import {
  getCaptureContractIntelligenceReport,
  runCaptureContractIntelligence,
} from "../contract/services/contract-intelligence-service";
import { getContractIntelligenceSignedUrl } from "../contract/infrastructure/contract-intelligence-storage";
import {
  getCaptureRiskAssessmentReport,
  getCaptureRiskDashboard,
  runCaptureGlosaRisk,
} from "../risk/services/glosa-risk-service";
import { getRiskAssessmentSignedUrl } from "../risk/infrastructure/risk-storage";
import { getAuditReportSignedUrl } from "../audit/infrastructure/audit-storage";
import {
  getCaptureCorrectionProposals,
  getCorrectionProposalsSignedUrl,
  runCaptureCorrectionAssistant,
  updateCaptureCorrectionProposal,
} from "../correction";
import {
  getCaptureLearningDashboard,
  getCaptureLearningMetrics,
  getCaptureLearningRecords,
  recordCaptureLearningDecision,
} from "../learning";
import type { CaptureChannel, CaptureSessionDetail } from "../types";

function parseCreateInput(raw: unknown) {
  const obj = requireObject(raw);
  const channel = optionalString(obj.channel, "channel") as CaptureChannel | undefined;
  return {
    channel,
    correlationId: optionalString(obj.correlationId, "correlationId"),
    targetEntityType: optionalString(obj.targetEntityType, "targetEntityType"),
    targetEntityId: optionalString(obj.targetEntityId, "targetEntityId"),
  };
}

function parseUploadInput(raw: unknown) {
  const obj = requireObject(raw);
  const fileObj = requireObject(obj.file, "file");
  return {
    sessionId: requireString(obj.sessionId, "sessionId"),
    file: {
      name: requireString(fileObj.name, "file.name"),
      mimeType: requireString(fileObj.mimeType, "file.mimeType"),
      base64Content: requireString(fileObj.base64Content, "file.base64Content"),
    },
  };
}

export const createCaptureSessionFn = createServerFn({ method: "POST" })
  .inputValidator(parseCreateInput)
  .handler(async ({ data }): Promise<MutationResult<{ session: CaptureSessionDetail }>> => {
    return runMutation(async (ctx) => {
      const session = await createCaptureSession(ctx, data);
      return { session: { ...session, documents: [] } };
    });
  });

export const uploadCaptureFileFn = createServerFn({ method: "POST" })
  .inputValidator(parseUploadInput)
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      const bytes = decodeBase64ToBytes(data.file.base64Content);
      const checksum = createHash("sha256").update(bytes).digest("hex");
      const uploadResult = await uploadCaptureDocument(ctx, {
        sessionId: data.sessionId,
        filename: data.file.name,
        mimeType: data.file.mimeType,
        byteLength: bytes.length,
        checksumSha256: checksum,
        fileBytes: bytes,
      });

      // ARCH-01 / EPC-24A — Enterprise Runtime bridge (Document Intake via Ports).
      // Side-effect estrutural; nunca altera o resultado funcional da Captura.
      // Dual-path AER-GA03-A1 permanece (eliminação iniciada; cutover não executado).
      void registerCaptureDocumentIntakeBridge({
        session: uploadResult.session,
        document: uploadResult.document,
        tenantId: ctx.tenantId,
      });

      // EPC-24A — pipeline operacional sob binding getEnterpriseRuntime() (sem cutover).
      await runCaptureOperationalPipelineBound(ctx, data.sessionId, "full");

      const session = await getCaptureSession(ctx, data.sessionId);
      return { session, document: uploadResult.document };
    });
  });

export const getCaptureSessionFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }): Promise<QueryResult<CaptureSessionDetail>> => {
    return runQuery((ctx) => getCaptureSession(ctx, data.sessionId));
  });

export const getCaptureSessionStatusFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery((ctx) => getCaptureSessionStatus(ctx, data.sessionId));
  });

export const deleteCaptureSessionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      await softDeleteCaptureSession(ctx, data.sessionId);
      return { sessionId: data.sessionId, deleted: true };
    });
  });

export const cancelCaptureSessionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      const session = await cancelCaptureSession(ctx, data.sessionId);
      return { sessionId: data.sessionId, cancelled: true, session };
    });
  });

export const retryCaptureUploadFn = createServerFn({ method: "POST" })
  .inputValidator(parseUploadInput)
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      const bytes = decodeBase64ToBytes(data.file.base64Content);
      const checksum = createHash("sha256").update(bytes).digest("hex");
      const uploadResult = await retryCaptureDocumentUpload(ctx, {
        sessionId: data.sessionId,
        filename: data.file.name,
        mimeType: data.file.mimeType,
        byteLength: bytes.length,
        checksumSha256: checksum,
        fileBytes: bytes,
      });

      // ARCH-01 / EPC-24A — Enterprise Runtime bridge (Document Intake via Ports).
      void registerCaptureDocumentIntakeBridge({
        session: uploadResult.session,
        document: uploadResult.document,
        tenantId: ctx.tenantId,
      });

      // EPC-24A — retry sob o mesmo binding (OCR→parser legado; sem cutover).
      await runCaptureOperationalPipelineBound(ctx, data.sessionId, "retry-upload");

      const session = await getCaptureSession(ctx, data.sessionId);
      return { session, document: uploadResult.document };
    });
  });

function parseSignedUrlInput(raw: unknown) {
  const obj = requireObject(raw);
  return {
    sessionId: requireString(obj.sessionId, "sessionId"),
    documentId: optionalString(obj.documentId, "documentId"),
  };
}

export const getCapturePreviewUrlFn = createServerFn({ method: "GET" })
  .inputValidator(parseSignedUrlInput)
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const result = await getCaptureDocumentSignedUrl(
        ctx,
        data.sessionId,
        data.documentId,
        "inline",
      );
      return result;
    });
  });

export const getCaptureDownloadUrlFn = createServerFn({ method: "GET" })
  .inputValidator(parseSignedUrlInput)
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const result = await getCaptureDocumentSignedUrl(
        ctx,
        data.sessionId,
        data.documentId,
        "attachment",
      );
      return result;
    });
  });

export const runCaptureOcrFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureOcr(ctx, data.sessionId));
  });

export const getCaptureOcrResultFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const ocr = await getCaptureOcrResult(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.ocr as JsonObject | undefined) ?? null;
      return { ocr, summary, metadata: status.metadata };
    });
  });

export const getCaptureOcrJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getOcrResultSignedUrl(ctx, data.sessionId));
  });

export const runCaptureParserFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureParser(ctx, data.sessionId));
  });

export const getCaptureStructuredGuideFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const guide = await getCaptureStructuredGuide(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.parser as JsonObject | undefined) ?? null;
      return { guide, summary, metadata: status.metadata };
    });
  });

export const getCaptureStructuredGuideJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getStructuredGuideSignedUrl(ctx, data.sessionId));
  });

export const runCaptureAuditFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureAudit(ctx, data.sessionId));
  });

export const getCaptureAuditReportFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const report = await getCaptureAuditReport(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.audit as JsonObject | undefined) ?? null;
      return { report, summary, metadata: status.metadata };
    });
  });

export const runCaptureContractIntelligenceFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureContractIntelligence(ctx, data.sessionId));
  });

export const getCaptureContractIntelligenceReportFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const report = await getCaptureContractIntelligenceReport(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.contractIntelligence as JsonObject | undefined) ?? null;
      return { report, summary, metadata: status.metadata };
    });
  });

export const getCaptureContractIntelligenceJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getContractIntelligenceSignedUrl(ctx, data.sessionId));
  });

export const runCaptureGlosaRiskFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureGlosaRisk(ctx, data.sessionId));
  });

export const getCaptureRiskAssessmentReportFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const report = await getCaptureRiskAssessmentReport(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.riskAssessment as JsonObject | undefined) ?? null;
      return { report, summary, metadata: status.metadata };
    });
  });

export const getCaptureRiskAssessmentJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getRiskAssessmentSignedUrl(ctx, data.sessionId));
  });

export const getCaptureRiskDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  return runQuery(async (ctx) => getCaptureRiskDashboard(ctx));
});

export const getCaptureAuditReportJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getAuditReportSignedUrl(ctx, data.sessionId));
  });

export const runCaptureCorrectionAssistantFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => runCaptureCorrectionAssistant(ctx, data.sessionId));
  });

export const getCaptureCorrectionProposalsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => {
      const store = await getCaptureCorrectionProposals(ctx, data.sessionId);
      const status = await getCaptureSessionStatus(ctx, data.sessionId);
      const summary = (status.metadata?.correction as JsonObject | undefined) ?? null;
      return { store, summary, metadata: status.metadata };
    });
  });

function parseUpdateCorrectionInput(raw: unknown) {
  const obj = requireObject(raw);
  return {
    sessionId: requireString(obj.sessionId, "sessionId"),
    proposalId: requireString(obj.proposalId, "proposalId"),
    action: requireString(obj.action, "action") as "accept" | "edit" | "reject",
    editedValue: optionalString(obj.editedValue, "editedValue"),
  };
}

export const updateCaptureCorrectionProposalFn = createServerFn({ method: "POST" })
  .inputValidator(parseUpdateCorrectionInput)
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      const store = await updateCaptureCorrectionProposal(ctx, data.sessionId, {
        proposalId: data.proposalId,
        action: data.action,
        editedValue: data.editedValue,
      });
      await recordCaptureLearningDecision(ctx, data.sessionId, store, {
        proposalId: data.proposalId,
        action: data.action,
        editedValue: data.editedValue,
      });
      return store;
    });
  });

export const getCaptureLearningDashboardFn = createServerFn({ method: "GET" }).handler(async () => {
  return runQuery(async (ctx) => getCaptureLearningDashboard(ctx));
});

export const getCaptureLearningMetricsFn = createServerFn({ method: "GET" }).handler(async () => {
  return runQuery(async (ctx) => getCaptureLearningMetrics(ctx));
});

export const getCaptureLearningRecordsFn = createServerFn({ method: "GET" }).handler(async () => {
  return runQuery(async (ctx) => getCaptureLearningRecords(ctx));
});

export const getCaptureCorrectionProposalsJsonDownloadFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ({
    sessionId: requireString(
      typeof raw === "object" && raw && "sessionId" in raw
        ? (raw as Record<string, unknown>).sessionId
        : raw,
      "sessionId",
    ),
  }))
  .handler(async ({ data }) => {
    return runQuery(async (ctx) => getCorrectionProposalsSignedUrl(ctx, data.sessionId));
  });
