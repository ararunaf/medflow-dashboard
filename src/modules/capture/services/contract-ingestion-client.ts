/**
 * Cliente — ingestão de contrato de operadora pela tela de Contratos.
 */
import {
  extractOperatorContractRulesFn,
  indexOperatorContractFn,
  prepareOperatorContractUploadFn,
} from "@/lib/capture/api/contract-ingestion-server";
import {
  CONTRACT_RULE_CATEGORIES,
  type ContractRuleCategory,
} from "@/lib/capture/contract/types/contract-rule-proposal";
import type { MutationResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { sha256Hex } from "../utils/file-format";

export const CONTRACT_CATEGORY_LABELS: Record<ContractRuleCategory, string> = {
  cobertura: "Cobertura",
  preco: "Preço",
  pre_autorizacao: "Pré-autorização",
  prazo: "Prazos",
  campo_obrigatorio: "Campos obrigatórios",
};

export type ContractIngestionStep =
  | { kind: "uploading" }
  | { kind: "indexing" }
  | { kind: "extracting"; category: ContractRuleCategory; index: number; total: number }
  | { kind: "done"; contractId: string; proposals: number; failedCategories: string[] }
  | { kind: "already_indexed"; contractId: string };

type Prepared =
  | { alreadyIndexed: true; contractId: string }
  | { alreadyIndexed: false; contractId: string; storagePath: string; token: string };

export async function ingestOperatorContract(
  input: { file: File; operatorCode: string; operatorName: string; contractLabel: string },
  onStep: (step: ContractIngestionStep) => void,
): Promise<void> {
  onStep({ kind: "uploading" });
  const checksumSha256 = await sha256Hex(input.file);
  const prepared = unwrap<Prepared>(
    (await prepareOperatorContractUploadFn({
      data: { byteLength: input.file.size, mimeType: input.file.type, checksumSha256 },
    })) as MutationResult<Prepared>,
  );
  if (prepared.alreadyIndexed) {
    onStep({ kind: "already_indexed", contractId: prepared.contractId });
    return;
  }

  const { error } = await getBrowserSupabase()
    .storage.from("clinical-documents")
    .uploadToSignedUrl(prepared.storagePath, prepared.token, input.file, {
      contentType: "application/pdf",
    });
  if (error) throw new Error(`Falha ao enviar o PDF: ${error.message}`);

  onStep({ kind: "indexing" });
  unwrap(
    (await indexOperatorContractFn({
      data: {
        contractId: prepared.contractId,
        checksumSha256,
        operatorCode: input.operatorCode,
        operatorName: input.operatorName,
        contractLabel: input.contractLabel,
      },
    })) as MutationResult<unknown>,
  );

  let proposals = 0;
  const failedCategories: string[] = [];
  for (const [index, category] of CONTRACT_RULE_CATEGORIES.entries()) {
    onStep({ kind: "extracting", category, index, total: CONTRACT_RULE_CATEGORIES.length });
    try {
      const result = unwrap<{ proposalCount: number }>(
        (await extractOperatorContractRulesFn({
          data: { contractId: prepared.contractId, category },
        })) as MutationResult<{ proposalCount: number }>,
      );
      proposals += result.proposalCount;
    } catch {
      // Uma categoria que falha não invalida as demais — a tela lista quais refazer.
      failedCategories.push(CONTRACT_CATEGORY_LABELS[category]);
    }
  }
  onStep({ kind: "done", contractId: prepared.contractId, proposals, failedCategories });
}
