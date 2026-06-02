import { assertCan, can } from "@/lib/auth/rbac";
import {
  ConflictError,
  StatusTransitionError,
  mapPostgresError,
} from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { FinancialClosingRow, FinancialClosingStatus } from "./types";

export async function getClosingStatusForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<FinancialClosingStatus | null> {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("financial_closings")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", competenceMonth)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return (data?.status as FinancialClosingStatus | undefined) ?? null;
}

/** Bloqueia sync de produção / repasses quando competência está locked ou finalized. */
export async function assertCompetenceEditableForBilling(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<void> {
  assertCan(ctx.role, "payouts:write");
  const st = await getClosingStatusForCompetence(ctx, competenceMonth);
  if (st === "locked" || st === "finalized") {
    throw new ConflictError(
      "Competência com fechamento travado ou finalizado. Solicite desbloqueio ao administrador do tenant.",
      { competenceMonth, status: st },
    );
  }
}

function assertTransitionRole(
  from: FinancialClosingStatus,
  to: FinancialClosingStatus,
  role: ServiceCtx["role"],
) {
  const needReopen =
    (from === "finalized" && to !== "finalized") ||
    (from === "locked" && to !== "locked" && to !== "finalized");
  if (needReopen && !can(role, "financial_closing:reopen")) {
    throw new StatusTransitionError(from, to, "financial_closing");
  }
}

export function assertValidStatusTransition(
  from: FinancialClosingStatus,
  to: FinancialClosingStatus,
  role: ServiceCtx["role"],
): void {
  assertTransitionRole(from, to, role);
  const ok =
    (from === "draft" && ["draft", "under_review"].includes(to)) ||
    (from === "under_review" && ["draft", "under_review", "validated"].includes(to)) ||
    (from === "validated" && ["under_review", "validated", "locked"].includes(to)) ||
    (from === "locked" && ["locked", "finalized", "validated"].includes(to)) ||
    (from === "finalized" && ["finalized", "under_review"].includes(to));
  if (!ok) {
    throw new StatusTransitionError(from, to, "financial_closing");
  }
}

export function isClosingImmutable(row: Pick<FinancialClosingRow, "status">): boolean {
  return row.status === "locked" || row.status === "finalized";
}
