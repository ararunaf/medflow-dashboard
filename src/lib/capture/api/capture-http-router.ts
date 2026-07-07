/**
 * REST API — Captura Inteligente
 * POST /capture | GET /capture/:id | GET /capture/:id/status | DELETE /capture/:id
 */
import { createHash } from "node:crypto";
import { ValidationError } from "@/lib/domain/operations/errors";
import { requireOperationalAuth } from "@/lib/server/operational-auth";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { decodeBase64ToBytes } from "../infrastructure/base64";
import {
  createCaptureSession,
  getCaptureSession,
  getCaptureSessionStatus,
  softDeleteCaptureSession,
  uploadCaptureDocument,
} from "../infrastructure/capture-session-store";
import type { CaptureChannel, CreateCaptureSessionInput } from "../types";

const CAPTURE_PREFIX = "/capture";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function errorResponse(code: string, message: string, status: number): Response {
  return jsonResponse({ ok: false, error: { code, message } }, status);
}

async function buildServiceCtx(): Promise<ServiceCtx | Response> {
  try {
    const auth = await requireOperationalAuth();
    return {
      client: auth.client,
      tenantId: auth.tenantId,
      role: auth.profile.role,
      userId: auth.userId,
      actorProfileId: auth.profile.id,
      professionalId: auth.professionalId,
    };
  } catch {
    return errorResponse("unauthenticated", "Sessão inválida ou expirada.", 401);
  }
}

function parseCapturePath(pathname: string): {
  sessionId?: string;
  subResource?: "status";
} | null {
  if (!pathname.startsWith(CAPTURE_PREFIX)) return null;
  const rest = pathname.slice(CAPTURE_PREFIX.length).replace(/^\//, "");
  if (!rest) return {};
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 1) return { sessionId: parts[0] };
  if (parts.length === 2 && parts[1] === "status") {
    return { sessionId: parts[0], subResource: "status" };
  }
  return null;
}

type CreateCaptureBody = {
  channel?: CaptureChannel;
  correlationId?: string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: Record<string, unknown>;
  file?: {
    name: string;
    mimeType: string;
    base64Content: string;
    checksumSha256?: string;
  };
};

async function handlePostCapture(ctx: ServiceCtx, request: Request): Promise<Response> {
  let body: CreateCaptureBody = {};
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    body = (await request.json()) as CreateCaptureBody;
  }

  const input: CreateCaptureSessionInput = {
    channel: body.channel ?? "file_upload",
    correlationId: body.correlationId,
    targetEntityType: body.targetEntityType,
    targetEntityId: body.targetEntityId,
    metadata: body.metadata,
  };

  const session = await createCaptureSession(ctx, input);

  if (body.file) {
    const bytes = decodeBase64ToBytes(body.file.base64Content);
    const checksum =
      body.file.checksumSha256 ??
      createHash("sha256").update(bytes).digest("hex");

    const result = await uploadCaptureDocument(ctx, {
      sessionId: session.id,
      filename: body.file.name,
      mimeType: body.file.mimeType,
      byteLength: bytes.length,
      checksumSha256: checksum,
      fileBytes: bytes,
    });

    return jsonResponse(
      {
        ok: true,
        data: {
          session: result.session,
          document: result.document,
        },
      },
      201,
    );
  }

  return jsonResponse({ ok: true, data: { session } }, 201);
}

async function handleGetCapture(ctx: ServiceCtx, sessionId: string): Promise<Response> {
  const detail = await getCaptureSession(ctx, sessionId);
  return jsonResponse({ ok: true, data: detail });
}

async function handleGetCaptureStatus(ctx: ServiceCtx, sessionId: string): Promise<Response> {
  const status = await getCaptureSessionStatus(ctx, sessionId);
  return jsonResponse({ ok: true, data: status });
}

async function handleDeleteCapture(ctx: ServiceCtx, sessionId: string): Promise<Response> {
  await softDeleteCaptureSession(ctx, sessionId);
  return jsonResponse({ ok: true, data: { sessionId, deleted: true } });
}

/**
 * Intercepta rotas /capture* antes do handler SSR.
 * Retorna null se a rota não for de captura.
 */
export async function handleCaptureHttpRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const parsed = parseCapturePath(url.pathname);
  if (parsed === null) return null;

  const ctxOrError = await buildServiceCtx();
  if (ctxOrError instanceof Response) return ctxOrError;
  const ctx = ctxOrError;

  try {
    if (request.method === "POST" && !parsed.sessionId) {
      return await handlePostCapture(ctx, request);
    }

    if (!parsed.sessionId) {
      return errorResponse("not_found", "Recurso não encontrado.", 404);
    }

    if (request.method === "GET" && parsed.subResource === "status") {
      return await handleGetCaptureStatus(ctx, parsed.sessionId);
    }

    if (request.method === "GET") {
      return await handleGetCapture(ctx, parsed.sessionId);
    }

    if (request.method === "DELETE") {
      return await handleDeleteCapture(ctx, parsed.sessionId);
    }

    return errorResponse("method_not_allowed", "Método não permitido.", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      err instanceof ValidationError ? 400 : message.includes("não encontrado") ? 404 : 500;
    const code =
      err instanceof ValidationError
        ? "validation_failed"
        : status === 404
          ? "not_found"
          : "internal_error";
    return errorResponse(code, message, status);
  }
}

/** Utilitário para testes — expõe parser de rotas. */
export function parseCaptureHttpPath(pathname: string) {
  return parseCapturePath(pathname);
}
