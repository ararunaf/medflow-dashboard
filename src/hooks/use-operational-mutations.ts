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
  confirmAssignmentFn,
  denySwapFn,
  rejectAssignmentFn,
  requestSwapFn,
  selfAssignOpenShiftFn,
  setProfessionalHospitalAffiliationFn,
  updateAvailabilityFn,
  type RequestSwapInput,
  type SetProfessionalHospitalAffiliationInput,
  type UpdateAvailabilityInput,
} from "@/lib/operations/api";
import type {
  AvailabilityRow,
  ShiftAssignmentRow,
  ShiftSwapRequestRow,
} from "@/lib/services/operations/types";
import { opsKeys } from "@/lib/queries/keys";
import { describeError, unwrap } from "@/lib/queries/result";
import { suppressOnce } from "@/lib/realtime/suppression";
import { toast } from "@/lib/toast/bus";

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
  const { message } = describeError(err);
  toast.error("Erro operacional", message);
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
