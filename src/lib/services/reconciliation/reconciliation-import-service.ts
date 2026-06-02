import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { appendReconciliationAudit } from "./reconciliation-audit-service";
import {
  deriveItemStatus,
  getOperationalReconciliationById,
  isReconciliationImmutable,
  refreshReconciliationTotalsFromItems,
} from "./reconciliation-service";

export type ParsedCsvReconciliationRow = {
  referenceType: "csv_import_row";
  referenceId: string;
  expectedValue: number;
  receivedValue: number;
  rawLine: number;
};

function parseMoney(raw: string): number {
  const t = raw.trim();
  if (!t) return 0;
  const normalized = t.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (Number.isNaN(n)) {
    throw new ValidationError(`Valor numérico inválido: "${raw}"`, { field: "csv" });
  }
  return Math.round(n * 100) / 100;
}

/** CSV simples: reference_type,reference_id,expected_value,received_value (cabeçalho opcional). */
export function parseOperationalReconciliationCsv(text: string): ParsedCsvReconciliationRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  let start = 0;
  const h = lines[0].toLowerCase();
  if (h.includes("reference_type") && h.includes("received_value")) {
    start = 1;
  }

  const crypto = globalThis.crypto;
  const out: ParsedCsvReconciliationRow[] = [];
  let lineNo = start;
  for (let i = start; i < lines.length; i++) {
    lineNo += 1;
    const parts = lines[i].split(";").length > 1 ? lines[i].split(";") : lines[i].split(",");
    if (parts.length < 3) {
      throw new ValidationError(`Linha ${lineNo}: mínimo 3 colunas (tipo, id, recebido).`, {
        field: "csv",
      });
    }
    const refIdStr = parts[1].trim();
    const expectedPart = parts[2]?.trim() ?? "0";
    const receivedPart = parts[3]?.trim() ?? parts[2]?.trim() ?? "0";

    let referenceId = refIdStr;
    if (!referenceId || referenceId === "0") {
      referenceId = crypto.randomUUID();
    } else if (!/^[0-9a-f-]{36}$/i.test(referenceId)) {
      throw new ValidationError(`Linha ${lineNo}: reference_id deve ser UUID ou vazio.`, {
        field: "csv",
      });
    }

    const expectedValue = parts.length >= 4 ? parseMoney(expectedPart) : 0;
    const receivedValue = parts.length >= 4 ? parseMoney(receivedPart) : parseMoney(expectedPart);

    const diff = Math.round((receivedValue - expectedValue) * 100) / 100;
    deriveItemStatus(expectedValue, receivedValue, diff);

    out.push({
      referenceType: "csv_import_row",
      referenceId,
      expectedValue,
      receivedValue,
      rawLine: lineNo,
    });
  }
  return out;
}

export async function applyCsvImportToReconciliation(
  ctx: ServiceCtx,
  input: { reconciliationId: string; csvText: string },
): Promise<{ rowsInserted: number }> {
  assertCan(ctx.role, "financial_closing:write");
  const rec = await getOperationalReconciliationById(ctx, input.reconciliationId);
  if (isReconciliationImmutable(rec)) {
    throw new ValidationError("Conciliação finalizada: importação bloqueada.", {
      field: "reconciliationId",
    });
  }

  const parsed = parseOperationalReconciliationCsv(input.csvText);
  if (parsed.length === 0) {
    throw new ValidationError("CSV vazio ou sem linhas de dados.", { field: "csv" });
  }
  if (parsed.length > 2000) {
    throw new ValidationError("No máximo 2000 linhas por importação.", { field: "csv" });
  }

  const { error: delErr } = await ctx.client
    .from("operational_reconciliation_items")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", input.reconciliationId)
    .eq("reference_type", "csv_import_row");
  if (delErr) throw mapPostgresError(delErr);

  const batch = parsed.map((r) => {
    const diff = Math.round((r.receivedValue - r.expectedValue) * 100) / 100;
    return {
      tenant_id: ctx.tenantId,
      reconciliation_id: input.reconciliationId,
      reference_type: "csv_import_row" as const,
      reference_id: r.referenceId,
      expected_value: r.expectedValue,
      received_value: r.receivedValue,
      difference_value: diff,
      status: deriveItemStatus(r.expectedValue, r.receivedValue, diff),
    };
  });

  const { error: insErr } = await ctx.client.from("operational_reconciliation_items").insert(batch);
  if (insErr) throw mapPostgresError(insErr);

  await appendReconciliationAudit(ctx, {
    reconciliationId: input.reconciliationId,
    action: "import_applied",
    payload: { rows: parsed.length, source: "csv" },
  });
  await refreshReconciliationTotalsFromItems(ctx, input.reconciliationId);
  return { rowsInserted: parsed.length };
}
