import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { listMedicalProductionForCompetence } from "@/lib/services/medical-payout/production-service";
import { appendReconciliationAudit } from "./reconciliation-audit-service";
import { runDivergenceDetectionAfterMatch } from "./operational-divergence-service";
import {
  deriveItemStatus,
  getOperationalReconciliationById,
  isReconciliationImmutable,
  refreshReconciliationTotalsFromItems,
  setReconciliationProcessing,
} from "./reconciliation-service";
import type { ReconciliationMatchingMode } from "./types";

const SYSTEM_REFERENCE_TYPES = [
  "competence_aggregate",
  "tiss_batch",
  "tiss_guide",
  "insurance_provider",
  "medical_payout",
] as const;

async function deleteSystemMatchItems(ctx: ServiceCtx, reconciliationId: string): Promise<void> {
  const { error } = await ctx.client
    .from("operational_reconciliation_items")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId)
    .in("reference_type", [...SYSTEM_REFERENCE_TYPES]);
  if (error) throw mapPostgresError(error);
}

async function insertItem(
  ctx: ServiceCtx,
  input: {
    reconciliationId: string;
    referenceType: (typeof SYSTEM_REFERENCE_TYPES)[number];
    referenceId: string | null;
    expectedValue: number;
    receivedValue: number;
  },
): Promise<void> {
  const diff = Math.round((input.receivedValue - input.expectedValue) * 100) / 100;
  const status = deriveItemStatus(input.expectedValue, input.receivedValue, diff);
  const { error } = await ctx.client.from("operational_reconciliation_items").insert({
    tenant_id: ctx.tenantId,
    reconciliation_id: input.reconciliationId,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    expected_value: input.expectedValue,
    received_value: input.receivedValue,
    difference_value: diff,
    status,
  });
  if (error) throw mapPostgresError(error);
}

export async function runOperationalMatching(
  ctx: ServiceCtx,
  input: { reconciliationId: string; mode: ReconciliationMatchingMode },
): Promise<void> {
  assertCan(ctx.role, "financial_closing:write");
  const rec = await getOperationalReconciliationById(ctx, input.reconciliationId);
  if (isReconciliationImmutable(rec)) {
    throw new ValidationError("Conciliação finalizada: matching bloqueado.", {
      field: "reconciliationId",
    });
  }

  const { data: closingBlock, error: cErr } = await ctx.client
    .from("financial_closings")
    .select("id, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", rec.competence_month)
    .maybeSingle();
  if (cErr) throw mapPostgresError(cErr);
  if (closingBlock?.status === "locked" || closingBlock?.status === "finalized") {
    throw new ValidationError(
      "Competência com fechamento travado ou finalizado: não é permitido recalcular matching.",
      { field: "competenceMonth" },
    );
  }

  await setReconciliationProcessing(ctx, input.reconciliationId);
  await deleteSystemMatchItems(ctx, input.reconciliationId);

  const production = await listMedicalProductionForCompetence(ctx, rec.competence_month);

  if (input.mode === "competence") {
    const expected = production.reduce((a, p) => a + Number(p.approved_value), 0);
    await insertItem(ctx, {
      reconciliationId: input.reconciliationId,
      referenceType: "competence_aggregate",
      referenceId: null,
      expectedValue: Math.round(expected * 100) / 100,
      receivedValue: 0,
    });
  } else if (input.mode === "guide") {
    for (const p of production) {
      const expected = Number(p.approved_value);
      await insertItem(ctx, {
        reconciliationId: input.reconciliationId,
        referenceType: "tiss_guide",
        referenceId: p.guide_id,
        expectedValue: expected,
        receivedValue: 0,
      });
    }
  } else if (input.mode === "batch") {
    const byBatch = new Map<string, number>();
    for (const p of production) {
      if (!p.batch_id) continue;
      byBatch.set(p.batch_id, (byBatch.get(p.batch_id) ?? 0) + Number(p.approved_value));
    }
    for (const [batchId, expected] of byBatch) {
      await insertItem(ctx, {
        reconciliationId: input.reconciliationId,
        referenceType: "tiss_batch",
        referenceId: batchId,
        expectedValue: Math.round(expected * 100) / 100,
        receivedValue: 0,
      });
    }
  } else if (input.mode === "insurance") {
    const guideIds = [...new Set(production.map((p) => p.guide_id))];
    if (guideIds.length === 0) {
      await appendReconciliationAudit(ctx, {
        reconciliationId: input.reconciliationId,
        action: "matching_run",
        payload: { mode: input.mode, note: "sem_guias" },
      });
    } else {
      const { data: guides, error: gErr } = await ctx.client
        .from("tiss_guides")
        .select("id, insurance_provider_id")
        .eq("tenant_id", ctx.tenantId)
        .in("id", guideIds);
      if (gErr) throw mapPostgresError(gErr);
      const map = new Map((guides ?? []).map((g) => [g.id, g.insurance_provider_id as string]));
      const agg = new Map<string, number>();
      for (const p of production) {
        const pid = map.get(p.guide_id);
        if (!pid) continue;
        agg.set(pid, (agg.get(pid) ?? 0) + Number(p.approved_value));
      }
      for (const [insuranceId, expected] of agg) {
        await insertItem(ctx, {
          reconciliationId: input.reconciliationId,
          referenceType: "insurance_provider",
          referenceId: insuranceId,
          expectedValue: Math.round(expected * 100) / 100,
          receivedValue: 0,
        });
      }
    }
  } else if (input.mode === "payout") {
    const { data: payouts, error: pErr } = await ctx.client
      .from("medical_payouts")
      .select("id, final_value, status")
      .eq("tenant_id", ctx.tenantId)
      .eq("competence_month", rec.competence_month);
    if (pErr) throw mapPostgresError(pErr);
    for (const po of payouts ?? []) {
      const expected = Number(po.final_value);
      const received = po.status === "paid" ? Number(po.final_value) : 0;
      await insertItem(ctx, {
        reconciliationId: input.reconciliationId,
        referenceType: "medical_payout",
        referenceId: po.id,
        expectedValue: Math.round(expected * 100) / 100,
        receivedValue: Math.round(received * 100) / 100,
      });
    }
  }

  await appendReconciliationAudit(ctx, {
    reconciliationId: input.reconciliationId,
    action: "matching_run",
    payload: { mode: input.mode },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_reconciliation",
    entity_id: input.reconciliationId,
    event_type: "operational_reconciliation_matching_run",
    severity: "info",
    description: `Matching operacional (${input.mode}) · ${rec.competence_month}`,
    metadata: { mode: input.mode },
  });

  await runDivergenceDetectionAfterMatch(ctx, input.reconciliationId);
  await refreshReconciliationTotalsFromItems(ctx, input.reconciliationId);
}
