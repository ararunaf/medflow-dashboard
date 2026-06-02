import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { markBatchExported } from "./batch-service";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * XML TISS esquelético (MVP): envelope + metadados + guias/itens para download local.
 * Não é layout ANS completo; serve como base versionada e auditável.
 */
export async function buildTissBatchXmlDocument(ctx: ServiceCtx, batchId: string): Promise<string> {
  assertCan(ctx.role, "tiss:read");
  const { data: batch, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batch) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });

  const { data: guides, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select(
      "id, guide_type, patient_name, attendance_date, status, total_value, insurance_provider_id, professional_id",
    )
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId);
  if (gErr) throw mapPostgresError(gErr);

  const guideRows = guides ?? [];
  const guideIds = guideRows.map((g) => g.id);
  let itemsByGuide: Record<
    string,
    {
      procedure_id: string;
      quantity: number;
      unit_value: number;
      total_value: number;
      execution_date: string;
    }[]
  > = {};
  if (guideIds.length > 0) {
    const { data: items, error: iErr } = await ctx.client
      .from("tiss_guide_items")
      .select("guide_id, procedure_id, quantity, unit_value, total_value, execution_date")
      .eq("tenant_id", ctx.tenantId)
      .in("guide_id", guideIds);
    if (iErr) throw mapPostgresError(iErr);
    itemsByGuide = {};
    for (const it of items ?? []) {
      const arr = itemsByGuide[it.guide_id] ?? [];
      arr.push(it);
      itemsByGuide[it.guide_id] = arr;
    }
  }

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<medflowTissExport version="0.1" xmlns="urn:medflow:tiss:export:0.1">`);
  lines.push(
    `  <batch id="${escapeXml(batch.id)}" number="${escapeXml(batch.batch_number)}" competence="${escapeXml(batch.competence)}" status="${escapeXml(batch.status)}">`,
  );
  lines.push(`    <totals guides="${batch.total_guides}" value="${batch.total_value}" />`);
  for (const g of guideRows) {
    lines.push(
      `    <guide id="${escapeXml(g.id)}" type="${escapeXml(g.guide_type)}" patient="${escapeXml(g.patient_name)}" date="${escapeXml(g.attendance_date)}" status="${escapeXml(g.status)}" value="${g.total_value}">`,
    );
    for (const it of itemsByGuide[g.id] ?? []) {
      lines.push(
        `      <item procedure="${escapeXml(it.procedure_id)}" qty="${it.quantity}" unit="${it.unit_value}" total="${it.total_value}" exec="${escapeXml(it.execution_date)}" />`,
      );
    }
    lines.push(`    </guide>`);
  }
  lines.push(`  </batch>`);
  lines.push(`</medflowTissExport>`);
  return lines.join("\n");
}

export async function exportTissBatchXml(
  ctx: ServiceCtx,
  batchId: string,
): Promise<{ xml: string; exportId: string }> {
  assertCan(ctx.role, "tiss:write");
  const { data: batchRow, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batchRow) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });
  if (batchRow.status !== "closed" && batchRow.status !== "exported") {
    throw new ValidationError("Feche o lote antes de exportar o XML.", { field: "status" });
  }
  const xml = await buildTissBatchXmlDocument(ctx, batchId);
  const checksum = await sha256Hex(xml);
  const preview = xml.slice(0, 500);
  const { data: exp, error: eErr } = await ctx.client
    .from("tiss_batch_exports")
    .insert({
      tenant_id: ctx.tenantId,
      batch_id: batchId,
      exported_by_profile_id: ctx.actorProfileId,
      checksum_sha256: checksum,
      byte_length: new TextEncoder().encode(xml).length,
      preview,
    })
    .select("id")
    .single();
  if (eErr) throw mapPostgresError(eErr);
  await markBatchExported(ctx, batchId);
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_batch_export",
    entity_id: exp.id,
    event_type: "tiss_batch_exported",
    severity: "info",
    description: "Exportação XML TISS (MVP) registrada",
    metadata: {
      batch_id: batchId,
      export_id: exp.id,
      checksum_sha256: checksum,
      byte_length: new TextEncoder().encode(xml).length,
    },
  });
  return { xml, exportId: exp.id };
}

export async function listTissBatchExports(ctx: ServiceCtx, batchId: string) {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_batch_exports")
    .select("id, batch_id, checksum_sha256, byte_length, preview, created_at")
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}
