/**
 * TUSS procedures — operacional (CRUD tenant) + ponte Enterprise (TISS-CONV-01).
 *
 * Conhecimento TISS canônico (validação / membership) NÃO usa esta tabela.
 * Fonte oficial: Enterprise Runtime → TISSCatalogPort.
 *
 * `tuss_procedures` permanece apenas como extensão operacional tenant-scoped
 * (specialty, default_value, etc.) — não é catálogo TISS paralelo de conhecimento.
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import {
  ensureCaptureTissKnowledge,
  getCaptureTissKnowledgeSnapshot,
  isTussInCatalogFromEnterprise,
} from "@/lib/capture/enterprise/tiss-knowledge-gateway";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { TussProcedureRow } from "./types";

/**
 * Lista procedimentos operacionais do tenant (CRUD).
 * Não substitui o Canonical Catalog — ver `listCanonicalTussProcedureCodes`.
 */
export async function listTussProcedures(ctx: ServiceCtx): Promise<TussProcedureRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tuss_procedures")
    .select("*")
    .eq("active", true)
    .order("code", { ascending: true });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

/**
 * Códigos TUSS canônicos via Enterprise TISSCatalogPort (TISS-CONV-01).
 * Única fonte de conhecimento para membership/validação.
 */
export async function listCanonicalTussProcedureCodes(ctx: ServiceCtx): Promise<readonly string[]> {
  assertCan(ctx.role, "tiss:read");
  await ensureCaptureTissKnowledge();
  return Array.from(getCaptureTissKnowledgeSnapshot().procedureCodes).sort();
}

/**
 * Membership canônico — exclusivamente via Enterprise Foundation.
 */
export async function isCanonicalTussProcedure(ctx: ServiceCtx, code: string): Promise<boolean> {
  assertCan(ctx.role, "tiss:read");
  await ensureCaptureTissKnowledge();
  return isTussInCatalogFromEnterprise(code);
}

export async function createTussProcedure(
  ctx: ServiceCtx,
  input: {
    code: string;
    description: string;
    specialty?: string;
    operational_group?: string;
    default_value?: number;
  },
): Promise<TussProcedureRow> {
  assertCan(ctx.role, "tuss:catalog:write");
  const { data, error } = await ctx.client
    .from("tuss_procedures")
    .insert({
      code: input.code.trim(),
      description: input.description.trim(),
      specialty: (input.specialty ?? "").trim(),
      operational_group: (input.operational_group ?? "").trim(),
      default_value: input.default_value ?? 0,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}
