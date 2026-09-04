/**
 * Utilitários compartilhados pelas server functions operacionais.
 *
 * - `MutationResult<T>`: resposta tipada com sucesso/erro (sem stack trace).
 * - `runMutation`: executa o callback dentro do contexto autenticado,
 *   converte `DomainError` em erro serializável e re-lança o restante.
 * - `requireObject` / `requireString`: validators leves para o `inputValidator()`
 *   de `createServerFn`.
 *
 * F5-S2: toda exceção INESPERADA (não `DomainError` — ou seja, um bug real,
 * não uma regra de negócio rejeitando algo) que escapa de `fn(ctx)` é
 * automaticamente registrada em `operational_errors`, não só devolvida ao
 * cliente. Antes disso, um erro inesperado em qualquer server function
 * virava um toast na tela do usuário e desaparecia — ninguém do lado do
 * servidor jamais saberia que aconteceu. `DomainError` (validação, RBAC
 * etc.) não é logado aqui — é comportamento esperado, não incidente.
 *
 * Server-only — protegido pelo `importProtection` em `vite.config.ts`.
 */
import { DomainError, ValidationError, isDomainError } from "@/lib/domain/operations/errors";
import { sanitizeString } from "@/lib/security/sanitize-input";
import { validateSessionState } from "@/lib/security/session-validation";
import { writeSecurityAudit } from "@/lib/server/security-audit-writer";
import { insertOperationalError } from "@/lib/services/operational-error/operational-error-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { requireOperationalAuth } from "./operational-auth";

export type MutationError = {
  code: DomainError["code"];
  message: string;
  details: DomainError["details"] | null;
};

export type MutationResult<T> = { ok: true; data: T } | { ok: false; error: MutationError };

/** Alias semântico: leituras usam o mesmo shape de retorno das mutations. */
export type QueryError = MutationError;
export type QueryResult<T> = MutationResult<T>;

function toMutationError(err: unknown): MutationError {
  if (isDomainError(err)) {
    return { code: err.code, message: err.message, details: err.details ?? null };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { code: "internal_error", message, details: null };
}

async function runWithCtx<T>(fn: (ctx: ServiceCtx) => Promise<T>): Promise<MutationResult<T>> {
  let ctx: ServiceCtx | null = null;
  try {
    const auth = await requireOperationalAuth();
    const sessionCheck = validateSessionState({
      userId: auth.userId,
      profile: auth.profile,
    });
    if (!sessionCheck.ok) {
      void writeSecurityAudit({
        category: "session",
        eventType: "session_validation_failed",
        outcome: "failure",
        tenantId: auth.profile?.tenant_id ?? null,
        profileId: auth.profile?.id ?? auth.userId,
        message: sessionCheck.issues.join(" "),
        metadata: { source: "runMutation" },
      });
      return {
        ok: false,
        error: {
          code: "unauthenticated",
          message: sessionCheck.issues.join(" "),
          details: null,
        },
      };
    }
    ctx = {
      client: auth.client,
      tenantId: auth.tenantId,
      role: auth.profile.role,
      userId: auth.userId,
      actorProfileId: auth.profile.id,
      professionalId: auth.professionalId,
    };
    const data = await fn(ctx);
    return { ok: true, data };
  } catch (err) {
    const mutErr = toMutationError(err);
    if (ctx && mutErr.code === "internal_error") {
      // Aguardado (não fire-and-forget): em runtime serverless/edge (Cloudflare
      // Workers), uma promise não aguardada pode ser cancelada assim que a
      // resposta é enviada — sem await, o registro do incidente não teria
      // garantia nenhuma de realmente acontecer.
      await insertOperationalError(ctx, {
        severity: "critical",
        source: "server",
        message: mutErr.message,
        stackSnippet: err instanceof Error ? (err.stack ?? null) : null,
      }).catch(() => undefined);
    }
    return { ok: false, error: mutErr };
  }
}

export async function runMutation<T>(
  fn: (ctx: ServiceCtx) => Promise<T>,
): Promise<MutationResult<T>> {
  return runWithCtx(fn);
}

/**
 * Igual a `runMutation`, porém semanticamente reservado para leituras
 * (loaders/queries). Mantemos a separação para deixar evidente no call-site
 * o tipo de operação e facilitar futuros middlewares (cache, ETag, etc.).
 */
export async function runQuery<T>(fn: (ctx: ServiceCtx) => Promise<T>): Promise<QueryResult<T>> {
  return runWithCtx(fn);
}

export function requireObject(value: unknown, field = "payload"): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`Payload ${field} deve ser um objeto.`, { field });
  }
  return value as Record<string, unknown>;
}

export function requireString(
  value: unknown,
  field: string,
  opts?: { maxLength?: number },
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`Campo ${field} é obrigatório.`, { field });
  }
  const sanitized = sanitizeString(value, { maxLength: opts?.maxLength ?? 8_192 });
  if (sanitized.length === 0) {
    throw new ValidationError(`Campo ${field} é obrigatório.`, { field });
  }
  return sanitized;
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`Campo ${field} deve ser texto.`, { field });
  }
  return value;
}
