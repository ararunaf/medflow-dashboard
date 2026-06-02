/**
 * Service de disponibilidade (availability).
 *
 * Regras enforçadas:
 * - usuário com role `professional` só altera as próprias janelas;
 * - manager pode alterar qualquer janela do tenant;
 * - weekday ∈ [0,6]; `start_time` < `end_time`;
 * - operação `upsertWindows` substitui o conjunto de janelas do profissional
 *   (delete + insert em transação lógica) — útil quando o painel envia o
 *   array completo de disponibilidade.
 */
import { assertCan, isOperationalManager } from "@/lib/auth/rbac";
import {
  PermissionError,
  TenantMismatchError,
  ValidationError,
  mapPostgresError,
} from "@/lib/domain/operations/errors";
import { expectTimeOfDay, expectUuid, expectWeekday } from "@/lib/domain/operations/validation";
import { availabilityUpdatedEvent } from "@/lib/operations/timeline";
import type { AvailabilityRow, ServiceCtx } from "./types";
import { recordOperationalEventSafe } from "./operational-event-service";

export type AvailabilityWindow = {
  weekday: number;
  startTime: string;
  endTime: string;
  available?: boolean;
};

export type UpdateAvailabilityInput = {
  professionalId: string;
  windows: AvailabilityWindow[];
};

function normalizeWindow(
  w: AvailabilityWindow,
  index: number,
): {
  weekday: number;
  start_time: string;
  end_time: string;
  available: boolean;
} {
  const weekday = expectWeekday(w.weekday, `windows[${index}].weekday`);
  const startTime = expectTimeOfDay(w.startTime, `windows[${index}].startTime`);
  const endTime = expectTimeOfDay(w.endTime, `windows[${index}].endTime`);
  if (endTime <= startTime) {
    throw new ValidationError(`windows[${index}]: endTime deve ser maior que startTime.`, {
      index,
    });
  }
  return {
    weekday,
    start_time: startTime,
    end_time: endTime,
    available: w.available ?? true,
  };
}

async function assertProfessionalInTenant(ctx: ServiceCtx, professionalId: string): Promise<void> {
  const { data, error } = await ctx.client
    .from("professionals")
    .select("id")
    .eq("id", professionalId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new TenantMismatchError("Profissional");
}

export async function updateAvailability(
  ctx: ServiceCtx,
  input: UpdateAvailabilityInput,
): Promise<AvailabilityRow[]> {
  const professionalId = expectUuid(input.professionalId, "professionalId");

  const isSelf = ctx.professionalId === professionalId;
  if (isSelf) {
    assertCan(ctx.role, "availability:update:self");
  } else {
    if (!isOperationalManager(ctx.role)) {
      throw new PermissionError("Profissional só pode editar a própria disponibilidade.", {
        professionalId,
      });
    }
    assertCan(ctx.role, "availability:update:any");
  }

  if (!Array.isArray(input.windows)) {
    throw new ValidationError("Campo `windows` deve ser um array.");
  }

  await assertProfessionalInTenant(ctx, professionalId);

  const normalized = input.windows.map(normalizeWindow);

  // Estratégia substituição-total: apaga janelas atuais e insere o conjunto novo.
  const { error: delErr } = await ctx.client
    .from("availability")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("professional_id", professionalId);
  if (delErr) throw mapPostgresError(delErr);

  if (normalized.length === 0) {
    await recordOperationalEventSafe(ctx, availabilityUpdatedEvent(professionalId, 0));
    return [];
  }

  const rows = normalized.map((w) => ({
    tenant_id: ctx.tenantId,
    professional_id: professionalId,
    weekday: w.weekday,
    start_time: w.start_time,
    end_time: w.end_time,
    available: w.available,
  }));

  const { data, error } = await ctx.client.from("availability").insert(rows).select("*");

  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(
    ctx,
    availabilityUpdatedEvent(professionalId, data?.length ?? 0),
  );
  return data ?? [];
}
