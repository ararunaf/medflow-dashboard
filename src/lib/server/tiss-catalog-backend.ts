/**
 * Server-only binder — hidrata o TISSCatalogStore compartilhado com dados reais
 * de TUSS/CID-10 vindos do Supabase (TISS-02-DATA).
 *
 * Usa service role. Não é Port. Não altera Enterprise Runtime nem TISSCatalogPort.
 * Arquivo sob `src/lib/server/` — bloqueado no client via importProtection.
 *
 * Escopo: TUSS + CID-10 (fontes públicas ANS/DATASUS). CBHPM fica fora até a
 * cooperativa definir a fonte licenciada (é propriedade da AMB, não é pública).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  applyRealCid10Codes,
  applyRealTissProcedures,
  markEnterpriseTissCatalogHydrated,
  type RealCid10Row,
  type RealTissProcedureRow,
} from "@/lib/enterprise/tiss-catalog/store";

type TussProcedureRow = {
  tuss_code: string;
  name: string;
  group_code: string | null;
  category: string | null;
  requires_authorization: boolean;
};

type Cid10Row = {
  cid_code: string;
  description: string;
  chapter: string | null;
};

async function fetchTussProcedures(client: SupabaseClient): Promise<RealTissProcedureRow[]> {
  const { data, error } = await client
    .from("tiss_tuss_procedures")
    .select("tuss_code, name, group_code, category, requires_authorization")
    .eq("status", "active");
  if (error) {
    throw new Error(`TISS-02-DATA: falha ao ler tiss_tuss_procedures (${error.message}).`);
  }
  return ((data ?? []) as TussProcedureRow[]).map((row) => ({
    code: row.tuss_code,
    name: row.name,
    groupCode: row.group_code ?? undefined,
    category: row.category ?? undefined,
    requiresAuthorization: row.requires_authorization,
  }));
}

async function fetchCid10Codes(client: SupabaseClient): Promise<RealCid10Row[]> {
  const { data, error } = await client
    .from("tiss_cid10_codes")
    .select("cid_code, description, chapter")
    .eq("status", "active");
  if (error) {
    throw new Error(`TISS-02-DATA: falha ao ler tiss_cid10_codes (${error.message}).`);
  }
  return ((data ?? []) as Cid10Row[]).map((row) => ({
    code: row.cid_code,
    description: row.description,
    chapter: row.chapter ?? undefined,
  }));
}

let hydratePromise: Promise<{ proceduresLoaded: number; cid10CodesLoaded: number } | null> | null =
  null;

/**
 * Hidrata o store compartilhado a partir do Supabase. Idempotente — chamadas
 * concorrentes reutilizam a mesma promise. Retorna `null` (sem lançar) se o
 * Supabase não estiver configurado — nesse caso o store fica no seed mínimo
 * de sempre, mesmo comportamento pré-TISS-02-DATA.
 */
export function bindServerTissCatalogStore(): Promise<{
  proceduresLoaded: number;
  cid10CodesLoaded: number;
} | null> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const cfg = getSupabasePublicConfig();
      const admin = getAdminSupabase() as SupabaseClient | null;
      if (!cfg || !admin) return null;

      const [procedures, cid10Codes] = await Promise.all([
        fetchTussProcedures(admin),
        fetchCid10Codes(admin),
      ]);

      const proceduresLoaded = applyRealTissProcedures(procedures);
      const cid10CodesLoaded = applyRealCid10Codes(cid10Codes);
      markEnterpriseTissCatalogHydrated({
        proceduresLoaded,
        cid10CodesLoaded,
        hydratedAt: new Date().toISOString(),
        source: "supabase:tiss_tuss_procedures+tiss_cid10_codes",
      });

      return { proceduresLoaded, cid10CodesLoaded };
    })().catch((error) => {
      hydratePromise = null;
      throw error;
    });
  }
  return hydratePromise;
}
