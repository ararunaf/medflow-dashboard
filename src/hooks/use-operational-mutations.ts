/**
 * Hooks de mutation operacionais (TanStack Query).
 *
 * Cada hook:
 *  - chama uma server function (`confirmAssignmentFn`, etc.);
 *  - desempacota o `MutationResult<T>` via `unwrap()` para que erros
 *    de domínio caiam em `onError`;
 *  - dispara `invalidateQueries` sobre as keys afetadas para garantir
 *    consistência mesmo se o realtime estiver lento ou inativo;
 *  - emite um **toast operacional** (sucesso ou erro) no padrão do
 *    design system;
 *  - registra o id afetado em `suppressOnce()` para que o handler
 *    realtime não dispare um segundo toast quando o mesmo `UPDATE`
 *    voltar do Postgres.
 *
 * Estratégia de invalidation (resumo):
 *   accept/reject assignment → dashboard + shiftsOpen + shiftsMine + assignmentsMine
 *   request swap            → dashboard + swapsMine + swapsPending + assignmentsMine
 *   update availability     → dashboard + availabilityMine
 *
 * Contrato:
 *   - `opts.onSuccess` / `opts.onError` continuam sendo chamados como
 *     antes; toasts e suppression são puramente aditivos.
 */
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import {
  approveSwapFn,
  cancelShiftFn,
  checkInFn,
  checkOutFn,
  confirmAssignmentFn,
  createAssignmentFn,
  createWorkGroupFn,
  denySwapFn,
  rejectAssignmentFn,
  requestSwapFn,
  reviewAttendanceFn,
  selfAssignOpenShiftFn,
  setProfessionalHospitalAffiliationFn,
  setProfessionalWorkGroupFn,
  suggestProfessionalsForShiftFn,
  updateAvailabilityFn,
  type CreateAssignmentInput,
  type RequestSwapInput,
  type SetProfessionalHospitalAffiliationInput,
  type SetProfessionalWorkGroupInput,
  type UpdateAvailabilityInput,
  type WorkGroupListItem,
} from "@/lib/operations/api";
import type {
  AvailabilityRow,
  ShiftAssignmentRow,
  ShiftRow,
  ShiftSwapRequestRow,
} from "@/lib/services/operations/types";
import type { ShiftMatchSuggestion } from "@/lib/services/operations/shift-matching-agent";
import type { AttendanceReviewSuggestion } from "@/lib/services/operations/checkin-confirmation-agent";
import { opsKeys } from "@/lib/queries/keys";
import { describeError, unwrap } from "@/lib/queries/result";
import { suppressOnce } from "@/lib/realtime/suppression";
import { toast } from "@/lib/toast/bus";
import { reportOperationalFailureClient } from "@/lib/observability/report-operational-failure-client";

type MutationHookOptions<TInput, TOutput> = Omit<
  UseMutationOptions<TOutput, Error, TInput>,
  "mutationFn"
>;

type OnSuccessArgs<TOutput, TInput> = Parameters<
  NonNullable<UseMutationOptions<TOutput, Error, TInput>["onSuccess"]>
>;

type OnErrorArgs<TOutput, TInput> = Parameters<
  NonNullable<UseMutationOptions<TOutput, Error, TInput>["onError"]>
>;

function reportError(err: unknown) {
  const { message, code } = describeError(err);
  toast.error("Erro operacional", message);
  // "internal_error" já é registrado do lado do servidor (fn-helpers.ts,
  // runWithCtx) — reportar de novo aqui duplicaria o incidente. "unknown" é
  // o que o servidor NUNCA vê (falha de rede, exceção só no cliente antes
  // de completar o round-trip) — esse sim precisa ser registrado aqui.
  if (code === "unknown") {
    void reportOperationalFailureClient({ source: "client", err, severity: "operational" });
  }
}

// -------------------------------------------------------------------------

export function useAcceptAssignment(
  opts: MutationHookOptions<{ assignmentId: string }, ShiftAssignmentRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }) =>
      unwrap(await confirmAssignmentFn({ data: { assignmentId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.success("Plantão confirmado");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useSelfAssignOpenShift(
  opts: MutationHookOptions<{ shiftId: string }, ShiftAssignmentRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, { shiftId: string }>({
    mutationFn: async ({ shiftId }) => unwrap(await selfAssignOpenShiftFn({ data: { shiftId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, { shiftId: string }>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.success("Plantão atribuído a você");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, { shiftId: string }>) => {
      reportError(args[0]);
      // Se o erro foi conflito (outro profissional já confirmou primeiro),
      // a vaga não está mais aberta — atualiza a lista para refletir isso.
      await qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() });
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

/** Gestor atribui (pending) um profissional específico a um plantão — fica pendente de aceite/recusa dele. */
export function useAssignProfessionalToShift(
  opts: MutationHookOptions<CreateAssignmentInput, ShiftAssignmentRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, CreateAssignmentInput>({
    mutationFn: async (input) => unwrap(await createAssignmentFn({ data: input })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, CreateAssignmentInput>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.success("Profissional atribuído — aguardando aceite");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
        qc.invalidateQueries({ queryKey: opsKeys.shifts() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, CreateAssignmentInput>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useCancelShift(opts: MutationHookOptions<{ shiftId: string }, ShiftRow> = {}) {
  const qc = useQueryClient();
  return useMutation<ShiftRow, Error, { shiftId: string }>({
    mutationFn: async ({ shiftId }) => unwrap(await cancelShiftFn({ data: { shiftId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftRow, { shiftId: string }>) => {
      const [data] = args;
      suppressOnce("shifts", data.id);
      toast.warning("Plantão cancelado");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
        qc.invalidateQueries({ queryKey: opsKeys.shifts() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftRow, { shiftId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

/** Shift Matching Agent (F4-S3): ação sob demanda, sem cache — cada clique é uma nova sugestão. */
export function useSuggestProfessionalsForShift(
  opts: MutationHookOptions<{ shiftId: string }, ShiftMatchSuggestion[]> = {},
) {
  return useMutation<ShiftMatchSuggestion[], Error, { shiftId: string }>({
    mutationFn: async ({ shiftId }) =>
      unwrap(await suggestProfessionalsForShiftFn({ data: { shiftId } })),
    onError: async (...args: OnErrorArgs<ShiftMatchSuggestion[], { shiftId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useRejectAssignment(
  opts: MutationHookOptions<{ assignmentId: string }, ShiftAssignmentRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }) =>
      unwrap(await rejectAssignmentFn({ data: { assignmentId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.warning("Plantão recusado", "Você liberou a atribuição.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useSetProfessionalHospitalAffiliation(
  opts: MutationHookOptions<SetProfessionalHospitalAffiliationInput, void> = {},
) {
  const qc = useQueryClient();
  return useMutation<void, Error, SetProfessionalHospitalAffiliationInput>({
    mutationFn: async (input) => unwrap(await setProfessionalHospitalAffiliationFn({ data: input })),
    onSuccess: async (
      ...args: OnSuccessArgs<void, SetProfessionalHospitalAffiliationInput>
    ) => {
      const [, variables] = args;
      toast.success(
        variables.active ? "Profissional afiliado à instituição" : "Afiliação desativada",
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.professionalAffiliations() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsOpen() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<void, SetProfessionalHospitalAffiliationInput>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useCreateWorkGroup(opts: MutationHookOptions<{ name: string }, WorkGroupListItem> = {}) {
  const qc = useQueryClient();
  return useMutation<WorkGroupListItem, Error, { name: string }>({
    mutationFn: async ({ name }) => unwrap(await createWorkGroupFn({ data: { name } })),
    onSuccess: async (...args: OnSuccessArgs<WorkGroupListItem, { name: string }>) => {
      const [data] = args;
      toast.success(`Grupo "${data.name}" criado`);
      await qc.invalidateQueries({ queryKey: opsKeys.workGroups() });
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<WorkGroupListItem, { name: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useSetProfessionalWorkGroup(
  opts: MutationHookOptions<SetProfessionalWorkGroupInput, void> = {},
) {
  const qc = useQueryClient();
  return useMutation<void, Error, SetProfessionalWorkGroupInput>({
    mutationFn: async (input) => unwrap(await setProfessionalWorkGroupFn({ data: input })),
    onSuccess: async (...args: OnSuccessArgs<void, SetProfessionalWorkGroupInput>) => {
      toast.success("Grupo de trabalho atualizado");
      await qc.invalidateQueries({ queryKey: opsKeys.workGroups() });
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<void, SetProfessionalWorkGroupInput>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

// -------------------------------------------------------------------------

export function useApproveSwap(
  opts: MutationHookOptions<
    { swapId: string },
    { swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow }
  > = {},
) {
  const qc = useQueryClient();
  return useMutation<
    { swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow },
    Error,
    { swapId: string }
  >({
    mutationFn: async ({ swapId }) => unwrap(await approveSwapFn({ data: { swapId } })),
    onSuccess: async (
      ...args: OnSuccessArgs<
        { swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow },
        { swapId: string }
      >
    ) => {
      const [data] = args;
      suppressOnce("shift_swap_requests", data.swap.id);
      toast.success("Troca aprovada");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsPending() }),
        qc.invalidateQueries({ queryKey: opsKeys.shifts() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignments() }),
        qc.invalidateQueries({ queryKey: opsKeys.commandCenter() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (
      ...args: OnErrorArgs<
        { swap: ShiftSwapRequestRow; targetAssignment: ShiftAssignmentRow },
        { swapId: string }
      >
    ) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useDenySwap(
  opts: MutationHookOptions<{ swapId: string }, ShiftSwapRequestRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftSwapRequestRow, Error, { swapId: string }>({
    mutationFn: async ({ swapId }) => unwrap(await denySwapFn({ data: { swapId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftSwapRequestRow, { swapId: string }>) => {
      const [data] = args;
      suppressOnce("shift_swap_requests", data.id);
      toast.warning("Troca recusada", "Solicitação encerrada.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsPending() }),
        qc.invalidateQueries({ queryKey: opsKeys.shifts() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignments() }),
        qc.invalidateQueries({ queryKey: opsKeys.commandCenter() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftSwapRequestRow, { swapId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useRequestSwap(
  opts: MutationHookOptions<RequestSwapInput, ShiftSwapRequestRow> = {},
) {
  const qc = useQueryClient();
  return useMutation<ShiftSwapRequestRow, Error, RequestSwapInput>({
    mutationFn: async (input) => unwrap(await requestSwapFn({ data: input })),
    onSuccess: async (...args: OnSuccessArgs<ShiftSwapRequestRow, RequestSwapInput>) => {
      const [data] = args;
      suppressOnce("shift_swap_requests", data.id);
      toast.info("Solicitação de troca enviada");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.swapsPending() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.commandCenter() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftSwapRequestRow, RequestSwapInput>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

// -------------------------------------------------------------------------

export function useUpdateAvailability(
  opts: MutationHookOptions<UpdateAvailabilityInput, AvailabilityRow[]> = {},
) {
  const qc = useQueryClient();
  return useMutation<AvailabilityRow[], Error, UpdateAvailabilityInput>({
    mutationFn: async (input) => unwrap(await updateAvailabilityFn({ data: input })),
    onSuccess: async (...args: OnSuccessArgs<AvailabilityRow[], UpdateAvailabilityInput>) => {
      const [data] = args;
      for (const row of data) suppressOnce("availability", row.id);
      toast.success("Disponibilidade atualizada");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.availabilityMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<AvailabilityRow[], UpdateAvailabilityInput>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

// -------------------------------------------------------------------------
// Presença (check-in/check-out) — F4-S4

export function useCheckIn(opts: MutationHookOptions<{ assignmentId: string }, ShiftAssignmentRow> = {}) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }) => unwrap(await checkInFn({ data: { assignmentId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.success("Check-in registrado");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.shiftsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

export function useCheckOut(opts: MutationHookOptions<{ assignmentId: string }, ShiftAssignmentRow> = {}) {
  const qc = useQueryClient();
  return useMutation<ShiftAssignmentRow, Error, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }) => unwrap(await checkOutFn({ data: { assignmentId } })),
    onSuccess: async (...args: OnSuccessArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      const [data] = args;
      suppressOnce("shift_assignments", data.id);
      toast.success("Check-out registrado — plantão concluído");
      await Promise.all([
        qc.invalidateQueries({ queryKey: opsKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: opsKeys.shifts() }),
        qc.invalidateQueries({ queryKey: opsKeys.shiftsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.assignmentsMine() }),
        qc.invalidateQueries({ queryKey: opsKeys.timeline() }),
      ]);
      await opts.onSuccess?.(...args);
    },
    onError: async (...args: OnErrorArgs<ShiftAssignmentRow, { assignmentId: string }>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}

/** Check-in Confirmation Agent (F4-S4): ação sob demanda, sem cache — cada clique é uma nova revisão. */
export function useReviewAttendance(
  opts: MutationHookOptions<void, AttendanceReviewSuggestion[]> = {},
) {
  return useMutation<AttendanceReviewSuggestion[], Error, void>({
    mutationFn: async () => unwrap(await reviewAttendanceFn()),
    onError: async (...args: OnErrorArgs<AttendanceReviewSuggestion[], void>) => {
      reportError(args[0]);
      await opts.onError?.(...args);
    },
    ...opts,
  });
}
