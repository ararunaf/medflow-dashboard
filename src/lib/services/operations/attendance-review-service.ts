/**
 * Orquestra o Check-in Confirmation Agent (F4-S4): carrega as atribuições
 * confirmadas cujo plantão já terminou dentro da janela de retrospecto,
 * delega o cálculo de sinais/verdict determinístico e a justificativa em
 * texto ao agente puro (checkin-confirmation-agent.ts), devolve a lista.
 *
 * Filtro por data feito em JS (não via `!inner` + filtro em coluna
 * aninhada do PostgREST) — mesma escolha do F4-S2 para o filtro por
 * hospital: sintaxe de filtro em recurso aninhado nunca foi validada neste
 * projeto, e a escala (atribuições confirmadas numa janela de ~30 dias)
 * não justifica o risco de uma consulta frágil.
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import type { ServiceCtx } from "./types";
import {
  buildAttendanceReview,
  generateAttendanceReviewSuggestions,
  type AttendanceReviewInput,
  type AttendanceReviewSuggestion,
} from "./checkin-confirmation-agent";

const DEFAULT_LOOKBACK_DAYS = 14;

const ATTENDANCE_REVIEW_SELECT = `
  id, professional_id, checked_in_at, checked_out_at,
  shift:shifts!shift_assignments_tenant_shift_fk (
    id, starts_at, ends_at,
    department:departments!shifts_tenant_department_fk ( name )
  ),
  professional:professionals!shift_assignments_tenant_professional_fk (
    id, profile:profiles!professionals_profile_id_fkey ( full_name )
  )
`;

type RawAttendanceRow = {
  id: string;
  professional_id: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  shift: { id: string; starts_at: string; ends_at: string; department: { name: string } | null } | null;
  professional: { id: string; profile: { full_name: string } | null } | null;
};

export async function reviewAttendance(
  ctx: ServiceCtx,
  opts: { lookbackDays?: number } = {},
): Promise<AttendanceReviewSuggestion[]> {
  assertCan(ctx.role, "attendance:review");

  const now = new Date();
  const lookbackDays = opts.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const since = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const { data, error } = await ctx.client
    .from("shift_assignments")
    .select(ATTENDANCE_REVIEW_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .eq("assignment_status", "confirmed")
    .returns<RawAttendanceRow[]>();
  if (error) throw mapPostgresError(error);

  const inputs: AttendanceReviewInput[] = (data ?? [])
    .filter((row): row is RawAttendanceRow & { shift: NonNullable<RawAttendanceRow["shift"]> } => {
      if (!row.shift) return false;
      const endsAtMs = new Date(row.shift.ends_at).getTime();
      return endsAtMs <= now.getTime() && endsAtMs >= since.getTime();
    })
    .map((row) => ({
      assignmentId: row.id,
      professionalId: row.professional_id,
      professionalName: row.professional?.profile?.full_name ?? "—",
      shiftId: row.shift.id,
      departmentName: row.shift.department?.name ?? "—",
      startsAt: row.shift.starts_at,
      endsAt: row.shift.ends_at,
      checkedInAt: row.checked_in_at,
      checkedOutAt: row.checked_out_at,
    }));

  const reviewed = buildAttendanceReview(inputs, now);
  if (reviewed.length === 0) return [];

  const aiProvider = createAIProviderFactory().create({ provider: "openai" });
  return generateAttendanceReviewSuggestions(aiProvider, reviewed);
}
