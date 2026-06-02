/**
 * Helpers de auditoria — snippets consistentes para metadata e inspeção.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";

/** Contexto mínimo do ator para enriquecer metadata (sem PII sensível). */
export function auditActorContext(ctx: ServiceCtx): Record<string, unknown> {
  return {
    actor_role: ctx.role,
    ...(ctx.professionalId ? { actor_professional_id: ctx.professionalId } : {}),
  };
}
