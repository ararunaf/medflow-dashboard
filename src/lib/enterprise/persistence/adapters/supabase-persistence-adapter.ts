/**
 * SupabasePersistenceAdapter — adapter default de persistência (EPC-01).
 *
 * Encapsula o mecanismo atual (Supabase) atrás do PersistencePort.
 * Não altera consultas, RLS, auth, storage nem comportamento observável.
 *
 * Nesta sprint o adapter prova o contrato (health/capabilities) e prepara
 * o encapsulamento. Repositórios/módulos existentes NÃO são migrados.
 */
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { PersistencePort } from "../ports/persistence-port";
import type { PersistenceCapabilities, PersistenceHealth } from "../ports/types";

export const SUPABASE_PERSISTENCE_ADAPTER_ID = "supabase-default";

/**
 * Runtime injetável — permite testes sem Vite env e evita acoplar o Port
 * a detalhes de cookie/SSR do cliente Supabase.
 */
export type SupabasePersistenceRuntime = {
  /** True quando URL + anon key públicas estão disponíveis. */
  isConfigured: () => boolean;
  /**
   * Probe opcional (rede). Default: não executa I/O — apenas config.
   * EPC-01 não altera endpoints de health de produção.
   */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
};

function defaultRuntime(): SupabasePersistenceRuntime {
  return {
    isConfigured: () => getSupabasePublicConfig() != null,
  };
}

export class SupabasePersistenceAdapter implements PersistencePort {
  readonly mechanismId = "supabase" as const;

  private readonly runtime: SupabasePersistenceRuntime;

  constructor(runtime: SupabasePersistenceRuntime = defaultRuntime()) {
    this.runtime = runtime;
  }

  capabilities(): PersistenceCapabilities {
    return {
      mechanism: "supabase",
      adapterId: SUPABASE_PERSISTENCE_ADAPTER_ID,
      supportsTransactions: true,
      supportsRowLevelSecurity: true,
      supportsRealtime: true,
      supportsJsonDocuments: true,
    };
  }

  async health(): Promise<PersistenceHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (!this.runtime.isConfigured()) {
      return {
        ok: false,
        mechanism: "supabase",
        message: "Supabase public config ausente (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
      };
    }

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        mechanism: "supabase",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "Supabase probe ok." : "Supabase probe falhou."),
      };
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: true,
      mechanism: "supabase",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: "Supabase configurado (probe de rede não executado — EPC-01).",
    };
  }
}
