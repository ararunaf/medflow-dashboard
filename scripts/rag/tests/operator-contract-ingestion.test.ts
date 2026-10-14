/**
 * Ingestão de contrato pela tela — guardas da biblioteca compartilhada
 * (src/lib/rag/operator-contract-ingestion.ts) que a server function usa
 * com cliente de service role: o tenant da sessão precisa filtrar a busca.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/database.types.ts";
import type { AIProviderPort } from "../../../src/lib/enterprise/ai-provider/ports/ai-provider-port.ts";
import {
  extractContractRulesForContractCategory,
  operatorContractStoragePath,
} from "../../../src/lib/rag/operator-contract-ingestion.ts";

type Row = { id: string; tenant_id: string; status: string };

function fakeClient(rows: Row[]) {
  return {
    from: () => {
      const filters: Array<[keyof Row, string]> = [];
      const builder = {
        select: () => builder,
        eq: (col: keyof Row, value: string) => {
          filters.push([col, value]);
          return builder;
        },
        maybeSingle: async () => ({
          data: rows.find((r) => filters.every(([c, v]) => r[c] === v)) ?? null,
          error: null,
        }),
      };
      return builder;
    },
  } as unknown as SupabaseClient<Database>;
}

const unusedAi = {
  invoke: async () => {
    throw new Error("IA não deveria ser chamada");
  },
} as unknown as AIProviderPort;

describe("extractContractRulesForContractCategory — guardas", () => {
  const rows: Row[] = [{ id: "c-1", tenant_id: "tenant-a", status: "indexed" }];

  it("não enxerga contrato de outra instituição quando o tenant é informado", async () => {
    await assert.rejects(
      extractContractRulesForContractCategory(fakeClient(rows), unusedAi, {
        contractId: "c-1",
        tenantId: "tenant-b",
        category: "prazo",
      }),
      /Contrato não encontrado/,
    );
  });

  it("recusa contrato que ainda não terminou de indexar", async () => {
    await assert.rejects(
      extractContractRulesForContractCategory(
        fakeClient([{ id: "c-2", tenant_id: "tenant-a", status: "indexing" }]),
        unusedAi,
        { contractId: "c-2", tenantId: "tenant-a", category: "prazo" },
      ),
      /indexing/,
    );
  });

  it("guarda o PDF na pasta da instituição (exigência da policy do bucket)", () => {
    assert.equal(
      operatorContractStoragePath("tenant-a", "c-1"),
      "tenant-a/contracts/c-1/original.pdf",
    );
  });
});
