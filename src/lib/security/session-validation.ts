import type { AuthContext } from "@/lib/auth/types";
import type { ProfileRow } from "@/lib/auth/types";
import { DomainError } from "@/lib/domain/operations/errors";

export type SessionValidationResult = {
  ok: boolean;
  issues: string[];
};

export type SessionStateInput = {
  userId?: string | null;
  profile?: ProfileRow | null;
};

/** Valida estado mínimo de sessão operacional (user + tenant + role). */
export function validateSessionState(input: SessionStateInput): SessionValidationResult {
  const issues: string[] = [];
  if (!input.userId) {
    issues.push("Sessão ausente.");
  }
  if (!input.profile?.tenant_id) {
    issues.push("Perfil sem tenant vinculado.");
  }
  if (!input.profile?.role) {
    issues.push("Perfil sem papel (role).");
  }
  return { ok: issues.length === 0, issues };
}

/** Validação leve de sessão para rotas sensíveis (smoke, export). */
export function validateOperationalSession(auth: AuthContext): SessionValidationResult {
  return validateSessionState({ userId: auth.user?.id, profile: auth.profile });
}

/** Lança DomainError se a sessão operacional estiver incompleta. */
export function assertValidSessionState(input: SessionStateInput): void {
  const result = validateSessionState(input);
  if (!result.ok) {
    throw new DomainError("unauthenticated", result.issues.join(" "));
  }
}
