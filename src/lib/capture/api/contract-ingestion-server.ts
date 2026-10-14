/**
 * Server functions — ingestão de contrato de operadora pela tela de
 * Contratos (antes só por CLI).
 *
 *   1. prepare: autoriza, deduplica por checksum e devolve token para o
 *      navegador gravar o PDF direto no storage (sem limite de 4,5 MB);
 *   2. index:   confere o PDF gravado e indexa por cláusula (embeddings);
 *   3. extract: Agente de Conhecimento de Contrato, uma categoria por chamada.
 *
 * O usuário é autorizado pelo `ServiceCtx` (perfil de faturamento, tenant da
 * sessão); só as escritas que as policies reservam ao servidor usam o
 * cliente de service role, sempre com o tenant fixado a partir do ctx.
 */
import { createServerFn } from "@tanstack/react-start";
import { createHash, randomUUID } from "node:crypto";
import { can } from "@/lib/auth/rbac";
import { PermissionError, ValidationError } from "@/lib/domain/operations/errors";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import {
  CONTRACT_STORAGE_BUCKET,
  extractContractRulesForContractCategory,
  findIndexedContractByChecksum,
  indexOperatorContract,
  operatorContractStoragePath,
} from "@/lib/rag/operator-contract-ingestion";
import { requireObject, requireString, runMutation } from "@/lib/server/fn-helpers";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  CONTRACT_RULE_CATEGORIES,
  type ContractRuleCategory,
} from "../contract/types/contract-rule-proposal";
import { CAPTURE_MAX_BYTES } from "../types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function assertCanIngest(ctx: ServiceCtx): void {
  if (!can(ctx.role, "tiss:write")) {
    throw new PermissionError("Sem permissão para enviar contratos de operadora.");
  }
}

function requireAdmin() {
  const admin = getAdminSupabase();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — ingestão de contrato indisponível.",
    );
  }
  return admin;
}

function requireChecksum(value: unknown): string {
  const checksum = requireString(value, "checksumSha256").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(checksum)) {
    throw new ValidationError("checksumSha256 inválido.", { field: "checksumSha256" });
  }
  return checksum;
}

function requireContractId(value: unknown): string {
  const id = requireString(value, "contractId");
  if (!UUID_RE.test(id)) throw new ValidationError("contractId inválido.", { field: "contractId" });
  return id;
}

export const prepareOperatorContractUploadFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw);
    const byteLength = Number(obj.byteLength);
    if (!Number.isInteger(byteLength) || byteLength <= 0 || byteLength > CAPTURE_MAX_BYTES) {
      throw new ValidationError(
        `Tamanho inválido (máx. ${Math.round(CAPTURE_MAX_BYTES / 1024 / 1024)}MB).`,
        { field: "byteLength" },
      );
    }
    if (obj.mimeType !== "application/pdf") {
      throw new ValidationError("Envie o contrato em PDF.", { field: "mimeType" });
    }
    return { byteLength, checksumSha256: requireChecksum(obj.checksumSha256) };
  })
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      assertCanIngest(ctx);
      const admin = requireAdmin();
      const existing = await findIndexedContractByChecksum(
        admin,
        ctx.tenantId,
        data.checksumSha256,
      );
      if (existing) {
        return { alreadyIndexed: true as const, contractId: existing.id };
      }
      const contractId = randomUUID();
      const storagePath = operatorContractStoragePath(ctx.tenantId, contractId);
      const { data: signed, error } = await admin.storage
        .from(CONTRACT_STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath, { upsert: true });
      if (error || !signed) {
        throw new Error(`Falha ao preparar envio do contrato: ${error?.message ?? "sem token"}`);
      }
      return {
        alreadyIndexed: false as const,
        contractId,
        storagePath,
        token: signed.token,
      };
    });
  });

export const indexOperatorContractFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw);
    const operatorCode = requireString(obj.operatorCode, "operatorCode").trim();
    if (!/^\d{6}$/.test(operatorCode)) {
      throw new ValidationError("Código ANS deve ter 6 dígitos.", { field: "operatorCode" });
    }
    const contractLabel = requireString(obj.contractLabel, "contractLabel").trim().slice(0, 120);
    const operatorName =
      typeof obj.operatorName === "string" && obj.operatorName.trim()
        ? obj.operatorName.trim().slice(0, 160)
        : null;
    return {
      contractId: requireContractId(obj.contractId),
      checksumSha256: requireChecksum(obj.checksumSha256),
      operatorCode,
      operatorName,
      contractLabel,
    };
  })
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      assertCanIngest(ctx);
      const admin = requireAdmin();
      const storagePath = operatorContractStoragePath(ctx.tenantId, data.contractId);
      const { data: blob, error } = await admin.storage
        .from(CONTRACT_STORAGE_BUCKET)
        .download(storagePath);
      if (error || !blob) {
        throw new ValidationError("PDF não encontrado no storage — o envio não terminou.", {
          storagePath,
        });
      }
      const pdfBytes = new Uint8Array(await blob.arrayBuffer());
      if (!PDF_MAGIC.every((byte, i) => pdfBytes[i] === byte)) {
        throw new ValidationError("O arquivo enviado não é um PDF válido.", { storagePath });
      }
      const checksum = createHash("sha256").update(pdfBytes).digest("hex");
      if (checksum !== data.checksumSha256) {
        throw new ValidationError("O arquivo recebido não confere com o enviado (checksum).", {
          storagePath,
        });
      }

      return indexOperatorContract(
        admin,
        createAIProviderFactory().create({ provider: "openai" }),
        {
          tenantId: ctx.tenantId,
          contractId: data.contractId,
          pdfBytes,
          operatorCode: data.operatorCode,
          operatorName: data.operatorName,
          contractLabel: data.contractLabel,
          createdBy: ctx.actorProfileId,
          alreadyStored: true,
        },
      );
    });
  });

export const extractOperatorContractRulesFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const obj = requireObject(raw);
    const category = requireString(obj.category, "category");
    if (!(CONTRACT_RULE_CATEGORIES as readonly string[]).includes(category)) {
      throw new ValidationError(`Categoria inválida: ${category}`, { field: "category" });
    }
    return {
      contractId: requireContractId(obj.contractId),
      category: category as ContractRuleCategory,
    };
  })
  .handler(async ({ data }) => {
    return runMutation(async (ctx) => {
      assertCanIngest(ctx);
      return extractContractRulesForContractCategory(
        requireAdmin(),
        createAIProviderFactory().create({ provider: "openai" }),
        { contractId: data.contractId, tenantId: ctx.tenantId, category: data.category },
      );
    });
  });
