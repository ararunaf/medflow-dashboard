/**
 * Erros de domínio operacional do MedFlow-IA.
 *
 * Toda exceção lançada pelas regras/services deve ser uma `DomainError`
 * (ou subclasse). A camada de server functions converte essas exceções
 * em respostas tipadas `{ ok: false, error }` para o cliente, sem vazar
 * stack traces nem mensagens internas.
 */

export type DomainErrorCode =
  | "validation_failed"
  | "permission_denied"
  | "unauthenticated"
  | "not_found"
  | "tenant_mismatch"
  | "conflict"
  | "invalid_status_transition"
  | "shift_cancelled"
  | "schedule_archived"
  | "swap_window_closed"
  | "swap_not_owner"
  | "internal_error";

export type DomainErrorDetails = Readonly<Record<string, string | number | boolean | null>>;

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details: DomainErrorDetails | undefined;

  constructor(code: DomainErrorCode, message: string, details?: DomainErrorDetails) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return { code: this.code, message: this.message, details: this.details ?? null };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: DomainErrorDetails) {
    super("validation_failed", message, details);
    this.name = "ValidationError";
  }
}

export class PermissionError extends DomainError {
  constructor(message = "Sem permissão para esta operação.", details?: DomainErrorDetails) {
    super("permission_denied", message, details);
    this.name = "PermissionError";
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = "Sessão expirada. Faça login novamente.") {
    super("unauthenticated", message);
    this.name = "UnauthenticatedError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super("not_found", `${entity} não encontrado.`, id ? { id } : undefined);
    this.name = "NotFoundError";
  }
}

export class TenantMismatchError extends DomainError {
  constructor(entity: string) {
    super("tenant_mismatch", `${entity} não pertence ao tenant do usuário.`, { entity });
    this.name = "TenantMismatchError";
  }
}

export class StatusTransitionError extends DomainError {
  constructor(from: string, to: string, entity: string) {
    super("invalid_status_transition", `Transição inválida em ${entity}: ${from} → ${to}.`, {
      entity,
      from,
      to,
    });
    this.name = "StatusTransitionError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: DomainErrorDetails) {
    super("conflict", message, details);
    this.name = "ConflictError";
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * Mapeia erros do Postgres (códigos sqlstate) lançados pelos triggers
 * de invariante para `DomainError` específico, preservando a mensagem.
 */
export function mapPostgresError(
  error: { code?: string; message?: string } | null | undefined,
): DomainError {
  const message = error?.message ?? "Erro inesperado no banco.";
  const sqlstate = error?.code;

  if (sqlstate === "23505") return new ConflictError(message);
  if (sqlstate === "23503") return new ValidationError(message);
  if (sqlstate === "23514") {
    if (/archived/i.test(message)) return new DomainError("schedule_archived", message);
    if (/cancelled|completed/i.test(message)) return new DomainError("shift_cancelled", message);
    if (/transition/i.test(message)) return new DomainError("invalid_status_transition", message);
    return new ValidationError(message);
  }
  if (sqlstate === "42501") return new PermissionError(message);
  return new DomainError("internal_error", message);
}
