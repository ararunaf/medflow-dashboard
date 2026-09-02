/**
 * Implementação infraestrutural de sessões de captura (sem OCR).
 */
import { NotFoundError, PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { can } from "@/lib/auth/rbac";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { POST_UPLOAD_AUTO_STATUSES, assertCaptureTransition } from "../state-machine";
import type {
  CaptureDocumentRecord,
  CaptureSessionDetail,
  CaptureSessionRecord,
  CaptureSessionStatus,
  CaptureStatusHistoryEntry,
  CreateCaptureSessionInput,
} from "../types";
import {
  appendCaptureEvent,
  buildCaptureEvent,
  buildFailedEvent,
  eventForDbStatusTransition,
} from "./capture-events";
import {
  buildAuditManifestKey,
  buildOriginalObjectKey,
  validateCaptureUpload,
} from "./storage-paths";
import { captureStorageSignedUrl, captureStorageUpload } from "./enterprise-storage-bridge";
import { buildVersionedObjectKey, nextDocumentVersion } from "./versioning";

const SIGNED_URL_TTL_SECONDS = 3600;

type DbSessionRow = {
  id: string;
  tenant_id: string;
  status: CaptureSessionStatus;
  channel: CaptureSessionRecord["channel"];
  correlation_id: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  metadata: JsonObject | null;
  status_history: CaptureStatusHistoryEntry[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type DbDocumentRow = {
  id: string;
  tenant_id: string;
  session_id: string;
  original_filename: string;
  mime_type: string;
  byte_length: number;
  checksum_sha256: string;
  storage_path_original: string;
  storage_path_processed: string | null;
  storage_path_thumbnail: string | null;
  storage_path_audit: string | null;
  page_count: number;
  metadata: JsonObject | null;
  created_at: string;
};

function mapSession(row: DbSessionRow): CaptureSessionRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    status: row.status,
    channel: row.channel,
    correlationId: row.correlation_id,
    targetEntityType: row.target_entity_type,
    targetEntityId: row.target_entity_id,
    metadata: (row.metadata ?? {}) as JsonObject,
    statusHistory: row.status_history ?? [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocument(row: DbDocumentRow): CaptureDocumentRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    tenantId: row.tenant_id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteLength: row.byte_length,
    checksumSha256: row.checksum_sha256,
    storagePathOriginal: row.storage_path_original,
    storagePathProcessed: row.storage_path_processed,
    storagePathThumbnail: row.storage_path_thumbnail,
    storagePathAudit: row.storage_path_audit,
    pageCount: row.page_count,
    metadata: (row.metadata ?? {}) as JsonObject,
    createdAt: row.created_at,
  };
}

function assertBillingAccess(ctx: ServiceCtx): void {
  if (!can(ctx.role, "financial_closing:read")) {
    throw new PermissionError("Sem permissão para captura inteligente.");
  }
}

/**
 * Deduplicação por conteúdo — antes de gravar no datalake e disparar OCR,
 * verifica se o mesmo checksum SHA-256 já existe no tenant, em outra sessão.
 * Não bloqueia reenvio da mesma sessão (retry legítimo após falha de
 * processamento usa o mesmo arquivo de propósito).
 */
async function rejectDuplicateCaptureUpload(
  ctx: ServiceCtx,
  input: { sessionId: string; checksumSha256: string },
): Promise<void> {
  const { data, error } = await ctx.client
    .from("capture_documents")
    .select("id, session_id, original_filename, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("checksum_sha256", input.checksumSha256)
    .neq("session_id", input.sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    throw new ValidationError(
      `Este arquivo já foi enviado anteriormente (sessão ${data.session_id}, "${data.original_filename}"). Reenvio com conteúdo idêntico foi bloqueado para evitar processamento duplicado.`,
      { duplicateOfSessionId: data.session_id, duplicateOfDocumentId: data.id },
    );
  }
}

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata: metadata as Json, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

async function emitPipelineEvent(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
  eventType: Parameters<typeof buildCaptureEvent>[0],
  payload?: JsonObject,
): Promise<JsonObject> {
  const event = buildCaptureEvent(eventType, sessionId, payload);
  const updated = appendCaptureEvent(metadata, event) as JsonObject;
  await persistSessionMetadata(ctx, sessionId, updated);
  return updated;
}

export async function createCaptureSession(
  ctx: ServiceCtx,
  input: CreateCaptureSessionInput = {},
): Promise<CaptureSessionRecord> {
  assertBillingAccess(ctx);

  const channel = input.channel ?? "file_upload";
  const initialHistory: CaptureStatusHistoryEntry[] = [
    {
      from: null,
      to: "CREATED",
      at: new Date().toISOString(),
      actorProfileId: ctx.actorProfileId,
      note: "session_created",
    },
  ];

  const initialMetadata = {
    ...(input.metadata ?? {}),
    capturePhase: "idle",
    documentVersion: 0,
  };

  const { data, error } = await ctx.client
    .from("capture_sessions")
    .insert({
      tenant_id: ctx.tenantId,
      status: "CREATED",
      channel,
      correlation_id: input.correlationId ?? null,
      target_entity_type: input.targetEntityType ?? null,
      target_entity_id: input.targetEntityId ?? null,
      metadata: initialMetadata as Json,
      status_history: initialHistory as unknown as Json,
      created_by: ctx.actorProfileId,
    })
    .select("*")
    .single();

  if (error) throw error;

  const session = mapSession(data as DbSessionRow);
  const metadataWithId = appendCaptureEvent(
    { ...session.metadata, capturePhase: "idle" },
    buildCaptureEvent("capture_created", session.id, { channel }),
  );
  await persistSessionMetadata(ctx, session.id, metadataWithId);

  return { ...session, metadata: metadataWithId };
}

export async function getCaptureSession(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CaptureSessionDetail> {
  assertBillingAccess(ctx);

  const { data: session, error: sessionErr } = await ctx.client
    .from("capture_sessions")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (sessionErr) throw sessionErr;
  if (!session) throw new NotFoundError("Sessão de captura", sessionId);

  const { data: docs, error: docsErr } = await ctx.client
    .from("capture_documents")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("session_id", sessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (docsErr) throw docsErr;

  return {
    ...mapSession(session as DbSessionRow),
    documents: ((docs ?? []) as DbDocumentRow[]).map(mapDocument),
  };
}

export async function getCaptureSessionStatus(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<{
  sessionId: string;
  status: CaptureSessionStatus;
  statusHistory: CaptureStatusHistoryEntry[];
  metadata: JsonObject;
  updatedAt: string;
}> {
  const detail = await getCaptureSession(ctx, sessionId);
  return {
    sessionId: detail.id,
    status: detail.status,
    statusHistory: detail.statusHistory,
    metadata: detail.metadata,
    updatedAt: detail.updatedAt,
  };
}

export async function transitionCaptureSession(
  ctx: ServiceCtx,
  sessionId: string,
  toStatus: CaptureSessionStatus,
  note?: string,
): Promise<CaptureSessionRecord> {
  assertBillingAccess(ctx);

  const current = await getCaptureSession(ctx, sessionId);
  assertCaptureTransition(current.status, toStatus);

  const entry: CaptureStatusHistoryEntry = {
    from: current.status,
    to: toStatus,
    at: new Date().toISOString(),
    actorProfileId: ctx.actorProfileId,
    note,
  };
  const statusHistory = [...current.statusHistory, entry];

  let metadata = current.metadata;
  const pipelineEvent = eventForDbStatusTransition(toStatus, sessionId);
  if (pipelineEvent) {
    metadata = appendCaptureEvent(metadata, pipelineEvent);
  }

  const { data, error } = await ctx.client
    .from("capture_sessions")
    .update({
      status: toStatus,
      status_history: statusHistory as Json,
      metadata: metadata as Json,
      updated_by: ctx.actorProfileId,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw error;
  return mapSession(data as DbSessionRow);
}

/** Avança sequencialmente até OCR_PENDING após upload — sem executar OCR. */
export async function advancePostUploadPipeline(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CaptureSessionRecord> {
  let session: CaptureSessionRecord = await getCaptureSession(ctx, sessionId);

  if (session.status === "CREATED") {
    session = await transitionCaptureSession(ctx, sessionId, "UPLOADED", "file_received");
  }

  while (session.status !== "OCR_PENDING") {
    const idx = POST_UPLOAD_AUTO_STATUSES.indexOf(session.status);
    if (idx === -1 || idx >= POST_UPLOAD_AUTO_STATUSES.length - 1) break;
    const next = POST_UPLOAD_AUTO_STATUSES[idx + 1]!;
    session = await transitionCaptureSession(ctx, sessionId, next, "post_upload_pipeline");
  }

  await persistSessionMetadata(ctx, sessionId, {
    ...session.metadata,
    capturePhase: "waiting_ocr",
    readyForOcr: true,
  } as JsonObject);

  const refreshed = await getCaptureSession(ctx, sessionId);
  return {
    id: refreshed.id,
    tenantId: refreshed.tenantId,
    status: refreshed.status,
    channel: refreshed.channel,
    correlationId: refreshed.correlationId,
    targetEntityType: refreshed.targetEntityType,
    targetEntityId: refreshed.targetEntityId,
    metadata: {
      ...refreshed.metadata,
      capturePhase: "waiting_ocr",
      readyForOcr: true,
    } as JsonObject,
    statusHistory: refreshed.statusHistory,
    createdBy: refreshed.createdBy,
    createdAt: refreshed.createdAt,
    updatedAt: refreshed.updatedAt,
  };
}

async function storeDocumentFile(
  ctx: ServiceCtx,
  input: {
    sessionId: string;
    filename: string;
    mimeType: string;
    byteLength: number;
    checksumSha256: string;
    fileBytes: Uint8Array;
    version: number;
  },
): Promise<{ session: CaptureSessionRecord; document: CaptureDocumentRecord }> {
  const storagePath =
    input.version > 1
      ? buildVersionedObjectKey(ctx.tenantId, input.sessionId, input.filename, input.version)
      : buildOriginalObjectKey(ctx.tenantId, input.sessionId, input.filename);
  const auditPath = buildAuditManifestKey(ctx.tenantId, input.sessionId);

  await captureStorageUpload(ctx, {
    key: storagePath,
    body: input.fileBytes,
    contentType: input.mimeType,
    upsert: input.version > 1,
    sessionId: input.sessionId,
  });

  const auditManifest = JSON.stringify({
    sessionId: input.sessionId,
    tenantId: ctx.tenantId,
    uploadedAt: new Date().toISOString(),
    originalPath: storagePath,
    checksumSha256: input.checksumSha256,
    version: input.version,
    note: "capture_pipeline_v1",
  });

  await captureStorageUpload(ctx, {
    key: auditPath,
    body: new TextEncoder().encode(auditManifest),
    contentType: "application/json",
    upsert: true,
    sessionId: input.sessionId,
  });

  const { data: doc, error: docErr } = await ctx.client
    .from("capture_documents")
    .insert({
      tenant_id: ctx.tenantId,
      session_id: input.sessionId,
      original_filename: input.filename,
      mime_type: input.mimeType,
      byte_length: input.byteLength,
      checksum_sha256: input.checksumSha256,
      storage_path_original: storagePath,
      storage_path_audit: auditPath,
      page_count: 1,
      metadata: { version: input.version } as Json,
      created_by: ctx.actorProfileId,
    })
    .select("*")
    .single();

  if (docErr) throw docErr;

  await ctx.client.from("capture_pages").insert({
    tenant_id: ctx.tenantId,
    session_id: input.sessionId,
    document_id: doc.id,
    page_number: 1,
    storage_path_original: storagePath,
    created_by: ctx.actorProfileId,
  });

  const updatedSession = await advancePostUploadPipeline(ctx, input.sessionId);

  await persistSessionMetadata(ctx, input.sessionId, {
    ...updatedSession.metadata,
    documentVersion: input.version,
  } as JsonObject);

  return {
    session: updatedSession,
    document: mapDocument(doc as DbDocumentRow),
  };
}

export async function uploadCaptureDocument(
  ctx: ServiceCtx,
  input: {
    sessionId: string;
    filename: string;
    mimeType: string;
    byteLength: number;
    checksumSha256: string;
    fileBytes: Uint8Array;
  },
): Promise<{ session: CaptureSessionRecord; document: CaptureDocumentRecord }> {
  assertBillingAccess(ctx);
  validateCaptureUpload({
    mimeType: input.mimeType,
    byteLength: input.byteLength,
    filename: input.filename,
    fileBytes: input.fileBytes,
  });
  await rejectDuplicateCaptureUpload(ctx, {
    sessionId: input.sessionId,
    checksumSha256: input.checksumSha256,
  });

  const session = await getCaptureSession(ctx, input.sessionId);
  if (session.status !== "CREATED" && session.status !== "UPLOADED") {
    throw new ValidationError("Upload permitido apenas em sessões CREATED ou UPLOADED.", {
      status: session.status,
    });
  }

  const version = nextDocumentVersion(session.metadata);
  return storeDocumentFile(ctx, { ...input, version });
}

/** Reenvio após falha — incrementa versão do documento. */
export async function retryCaptureDocumentUpload(
  ctx: ServiceCtx,
  input: {
    sessionId: string;
    filename: string;
    mimeType: string;
    byteLength: number;
    checksumSha256: string;
    fileBytes: Uint8Array;
  },
): Promise<{ session: CaptureSessionRecord; document: CaptureDocumentRecord }> {
  assertBillingAccess(ctx);
  validateCaptureUpload({
    mimeType: input.mimeType,
    byteLength: input.byteLength,
    filename: input.filename,
    fileBytes: input.fileBytes,
  });
  await rejectDuplicateCaptureUpload(ctx, {
    sessionId: input.sessionId,
    checksumSha256: input.checksumSha256,
  });

  const session = await getCaptureSession(ctx, input.sessionId);
  const canRetry =
    session.metadata.capturePhase === "failed" ||
    session.status === "OCR_PENDING" ||
    session.status === "CREATED";

  if (!canRetry) {
    throw new ValidationError("Retry não permitido neste estado.", { status: session.status });
  }

  const version = nextDocumentVersion(session.metadata);
  await persistSessionMetadata(ctx, input.sessionId, {
    ...session.metadata,
    capturePhase: "uploading",
    lastRetryAt: new Date().toISOString(),
  });

  try {
    if (session.status === "CREATED") {
      return storeDocumentFile(ctx, { ...input, version });
    }

    await persistSessionMetadata(ctx, input.sessionId, {
      ...session.metadata,
      capturePhase: "uploading",
      documentVersion: version,
    });
    return storeDocumentFile(ctx, { ...input, version });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const metadata = appendCaptureEvent(
      { ...session.metadata, capturePhase: "failed" },
      buildFailedEvent(input.sessionId, reason, "uploading"),
    );
    await persistSessionMetadata(ctx, input.sessionId, metadata);
    throw err;
  }
}

export async function cancelCaptureSession(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<CaptureSessionRecord> {
  assertBillingAccess(ctx);

  const session = await getCaptureSession(ctx, sessionId);
  const metadata = {
    ...session.metadata,
    capturePhase: "cancelled",
    cancelledAt: new Date().toISOString(),
  };

  const { data, error } = await ctx.client
    .from("capture_sessions")
    .update({
      status: "ARCHIVED",
      metadata: metadata as Json,
      updated_by: ctx.actorProfileId,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw error;
  return mapSession(data as DbSessionRow);
}

export async function markCaptureSessionFailed(
  ctx: ServiceCtx,
  sessionId: string,
  reason: string,
): Promise<CaptureSessionRecord> {
  assertBillingAccess(ctx);
  const session = await getCaptureSession(ctx, sessionId);
  const metadata = appendCaptureEvent(
    { ...session.metadata, capturePhase: "failed", failureReason: reason } as JsonObject,
    buildFailedEvent(sessionId, reason),
  );
  await persistSessionMetadata(ctx, sessionId, metadata);
  return { ...session, metadata };
}

export async function getCaptureDocumentSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  documentId: string | undefined,
  disposition: "inline" | "attachment",
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  assertBillingAccess(ctx);

  const detail = await getCaptureSession(ctx, sessionId);
  const doc =
    documentId != null
      ? detail.documents.find((d) => d.id === documentId)
      : detail.documents[detail.documents.length - 1];

  if (!doc) throw new NotFoundError("Documento de captura", documentId ?? sessionId);

  const { signedUrl, expiresAt } = await captureStorageSignedUrl(ctx, {
    key: doc.storagePathOriginal,
    expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    downloadFilename: disposition === "attachment" ? doc.originalFilename : undefined,
    documentId: doc.id,
    sessionId,
  });

  return { signedUrl, expiresAt, filename: doc.originalFilename };
}

export async function softDeleteCaptureSession(ctx: ServiceCtx, sessionId: string): Promise<void> {
  assertBillingAccess(ctx);

  const now = new Date().toISOString();
  const { error: sessionErr } = await ctx.client
    .from("capture_sessions")
    .update({
      deleted_at: now,
      deleted_by: ctx.actorProfileId,
      status: "ARCHIVED",
      updated_by: ctx.actorProfileId,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);

  if (sessionErr) throw sessionErr;

  await ctx.client
    .from("capture_documents")
    .update({ deleted_at: now, deleted_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("session_id", sessionId)
    .is("deleted_at", null);
}
