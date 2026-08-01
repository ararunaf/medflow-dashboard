/**
 * Utilitários de cliente para lidar com o shape `MutationResult<T>` /
 * `QueryResult<T>` devolvido pelas server functions operacionais.
 *
 * - `unwrap(result)` lança um `OperationalError` quando `ok=false`,
 *   permitindo que TanStack Query mova para o estado `error`.
 * - `OperationalError` carrega `code`/`details` para a UI exibir
 *   mensagens domínio-específicas sem expor stack traces.
 */
import type { MutationResult, QueryResult } from "@/lib/operations/api";
import type { DomainErrorCode } from "@/lib/domain/operations";
import { classifyError } from "@/lib/errors/classify";
import type { AppErrorKind } from "@/lib/errors/types";

export class OperationalError extends Error {
  readonly code: DomainErrorCode;
  readonly details: Readonly<Record<string, string | number | boolean | null>> | null;

  constructor(
    code: DomainErrorCode,
    message: string,
    details: Readonly<Record<string, string | number | boolean | null>> | null,
  ) {
    super(message);
    this.name = "OperationalError";
    this.code = code;
    this.details = details;
  }
}

export function isOperationalError(err: unknown): err is OperationalError {
  return err instanceof OperationalError;
}

/**
 * Garante o sucesso do server result ou lança `OperationalError`.
 * Use em `queryFn` e dentro de `mutationFn` para que TanStack Query
 * capture o erro de domínio normalmente.
 *
 * Overload com `unknown` cobre server functions cuja tipagem de retorno
 * colapsa para `unknown` (serialização TanStack), sem degradar a
 * inferência genérica nos call-sites tipados.
 */
export function unwrap<T>(result: QueryResult<T> | MutationResult<T>): T;
export function unwrap<T>(result: unknown): T;
export function unwrap<T>(result: QueryResult<T> | MutationResult<T> | unknown): T {
  const r = result as QueryResult<T> | MutationResult<T>;
  if (r && typeof r === "object" && "ok" in r) {
    if (r.ok) return r.data;
    throw new OperationalError(r.error.code, r.error.message, r.error.details ?? null);
  }
  throw new OperationalError("internal_error", "Resposta de servidor inválida.", null);
}

/** Mapeia códigos de domínio para mensagens curtas de UI. */
const FRIENDLY_MESSAGES: Partial<Record<DomainErrorCode, string>> = {
  unauthenticated: "Sessão expirada. Faça login novamente.",
  permission_denied: "Você não tem permissão para esta operação.",
  not_found: "Registro não encontrado.",
  tenant_mismatch: "Operação fora do tenant.",
  conflict: "Já existe um registro conflitante.",
  invalid_status_transition: "Transição de status inválida.",
  shift_cancelled: "Plantão em estado não-operável.",
  schedule_archived: "Escala arquivada.",
  swap_window_closed: "Janela de troca encerrada.",
  swap_not_owner: "Você não é o titular do plantão.",
  validation_failed: "Dados inválidos no formulário.",
  internal_error: "Erro inesperado. Tente novamente em instantes.",
};

export function describeError(err: unknown): {
  message: string;
  code: DomainErrorCode | AppErrorKind | "unknown";
  kind?: AppErrorKind;
} {
  if (isOperationalError(err)) {
    return {
      code: err.code,
      message: FRIENDLY_MESSAGES[err.code] ?? err.message,
    };
  }
  const classified = classifyError(err);
  if (classified.kind !== "unknown") {
    return { code: classified.kind, message: classified.message, kind: classified.kind };
  }
  if (err instanceof Error) {
    return { code: "unknown", message: err.message };
  }
  return { code: "unknown", message: "Erro desconhecido." };
}
