import type { DomainErrorCode } from "@/lib/domain/operations";
import type { AppErrorKind, ClassifiedError } from "./types";
import { messageForKind } from "./messages";

function readOperationalCode(err: unknown): DomainErrorCode | null {
  if (!(err instanceof Error) || err.name !== "OperationalError") return null;
  const code = (err as Error & { code?: unknown }).code;
  return typeof code === "string" ? (code as DomainErrorCode) : null;
}

export class QueryTimeoutError extends Error {
  constructor(message = messageForKind("timeout")) {
    super(message);
    this.name = "QueryTimeoutError";
  }
}

function textOf(err: unknown): string {
  if (err instanceof Error) return `${err.name} ${err.message}`;
  return String(err ?? "");
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function matchesInvalidToken(text: string): boolean {
  return (
    /invalid.*(jwt|token|refresh|session)/i.test(text) ||
    /jwt.*(expired|invalid|malformed)/i.test(text) ||
    /bad_jwt/i.test(text) ||
    /refresh_token_not_found/i.test(text) ||
    /session_not_found/i.test(text)
  );
}

function matchesSessionExpired(text: string): boolean {
  return (
    /session.*expir/i.test(text) ||
    /token.*expir/i.test(text) ||
    /jwt expired/i.test(text) ||
    /not authenticated/i.test(text) ||
    /unauthenticated/i.test(text)
  );
}

function matchesTimeout(text: string, err: unknown): boolean {
  if (err instanceof QueryTimeoutError) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return (
    /timeout/i.test(text) ||
    /timed out/i.test(text) ||
    /ETIMEDOUT/i.test(text) ||
    /deadline exceeded/i.test(text)
  );
}

function matchesOffline(text: string): boolean {
  if (isOffline()) return true;
  return (
    /failed to fetch/i.test(text) ||
    /networkerror/i.test(text) ||
    /network request failed/i.test(text) ||
    /ERR_INTERNET_DISCONNECTED/i.test(text) ||
    /Load failed/i.test(text)
  );
}

/**
 * Classifica erros de rede, auth, domínio e runtime para UI e redirects.
 */
export function classifyError(err: unknown): ClassifiedError {
  const opCode = readOperationalCode(err);
  if (opCode) {
    if (opCode === "unauthenticated") {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : messageForKind("session_expired");
      return {
        kind: "session_expired",
        message,
        requiresAuthRedirect: true,
      };
    }
    if (opCode === "permission_denied") {
      return {
        kind: "permission_denied",
        message:
          err instanceof Error
            ? err.message || messageForKind("permission_denied")
            : messageForKind("permission_denied"),
        requiresAuthRedirect: false,
      };
    }
  }

  const text = textOf(err);

  if (matchesOffline(text)) {
    return {
      kind: "offline",
      message: messageForKind("offline"),
      requiresAuthRedirect: false,
    };
  }

  if (matchesInvalidToken(text)) {
    return {
      kind: "invalid_token",
      message: messageForKind("invalid_token"),
      requiresAuthRedirect: true,
    };
  }

  if (matchesSessionExpired(text)) {
    return {
      kind: "session_expired",
      message: messageForKind("session_expired"),
      requiresAuthRedirect: true,
    };
  }

  if (matchesTimeout(text, err)) {
    return {
      kind: "timeout",
      message: messageForKind("timeout"),
      requiresAuthRedirect: false,
    };
  }

  const message =
    err instanceof Error && err.message.trim() ? err.message : messageForKind("unknown");

  return { kind: "unknown", message, requiresAuthRedirect: false };
}

export function isAuthFailureKind(kind: AppErrorKind): boolean {
  return kind === "session_expired" || kind === "invalid_token";
}
