/**
 * SupabaseStorageAdapter — adapter default de storage (EPC-02).
 *
 * Encapsula o mecanismo atual (Supabase Storage) atrás do StoragePort.
 * Não altera buckets, uploads, downloads, OCR, Captura Inteligente nem
 * comportamento observável dos módulos existentes.
 *
 * Nesta sprint o adapter prova o contrato (health/capabilities/ops via runtime
 * injetável). Módulos de produção NÃO são migrados para o Port.
 */
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { StoragePort } from "../ports/storage-port";
import type {
  StorageCapabilities,
  StorageDeleteInput,
  StorageDeleteResult,
  StorageGetInput,
  StorageGetResult,
  StorageHealth,
  StoragePutInput,
  StoragePutResult,
  StorageSignedUrlInput,
  StorageSignedUrlResult,
} from "../ports/types";

export const SUPABASE_STORAGE_ADAPTER_ID = "supabase-default";

/**
 * Runtime injetável — permite testes sem Vite env e evita acoplar o Port
 * a detalhes de cookie/SSR do cliente Supabase Storage.
 *
 * EPC-02 não altera clients/uploads/downloads de produção: operações de objeto
 * só executam I/O quando o runtime fornece delegates explícitos.
 */
export type SupabaseStorageRuntime = {
  /** True quando URL + anon key públicas estão disponíveis. */
  isConfigured: () => boolean;
  /**
   * Probe opcional (rede). Default: não executa I/O — apenas config.
   * EPC-02 não altera endpoints de health de produção.
   */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  put?: (input: StoragePutInput) => Promise<StoragePutResult>;
  get?: (input: StorageGetInput) => Promise<StorageGetResult>;
  delete?: (input: StorageDeleteInput) => Promise<StorageDeleteResult>;
  signedUrl?: (input: StorageSignedUrlInput) => Promise<StorageSignedUrlResult>;
};

function defaultRuntime(): SupabaseStorageRuntime {
  return {
    isConfigured: () => getSupabasePublicConfig() != null,
  };
}

function unboundResult(
  operation: string,
  key: string,
): { ok: false; key: string; message: string } {
  return {
    ok: false,
    key,
    message:
      `Supabase Storage "${operation}" não vinculado no runtime (EPC-02 foundation). ` +
      `Módulos de produção continuam no caminho legado; bind via runtime ou migração futura.`,
  };
}

export class SupabaseStorageAdapter implements StoragePort {
  readonly providerId = "supabase" as const;

  private readonly runtime: SupabaseStorageRuntime;

  constructor(runtime: SupabaseStorageRuntime = defaultRuntime()) {
    this.runtime = runtime;
  }

  capabilities(): StorageCapabilities {
    return {
      provider: "supabase",
      adapterId: SUPABASE_STORAGE_ADAPTER_ID,
      supportsPut: true,
      supportsGet: true,
      supportsDelete: true,
      supportsSignedUrl: true,
      supportsVersioning: false,
    };
  }

  async health(): Promise<StorageHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (!this.runtime.isConfigured()) {
      return {
        ok: false,
        provider: "supabase",
        message: "Supabase public config ausente (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).",
      };
    }

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "supabase",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok ? "Supabase Storage probe ok." : "Supabase Storage probe falhou."),
      };
    }

    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: true,
      provider: "supabase",
      latencyMs: Math.max(0, Math.round(end - start)),
      message: "Supabase Storage configurado (probe de rede não executado — EPC-02).",
    };
  }

  async put(input: StoragePutInput): Promise<StoragePutResult> {
    if (this.runtime.put) {
      return this.runtime.put(input);
    }
    return unboundResult("put", input.key);
  }

  async get(input: StorageGetInput): Promise<StorageGetResult> {
    if (this.runtime.get) {
      return this.runtime.get(input);
    }
    return unboundResult("get", input.key);
  }

  async delete(input: StorageDeleteInput): Promise<StorageDeleteResult> {
    if (this.runtime.delete) {
      return this.runtime.delete(input);
    }
    return unboundResult("delete", input.key);
  }

  async signedUrl(input: StorageSignedUrlInput): Promise<StorageSignedUrlResult> {
    if (this.runtime.signedUrl) {
      return this.runtime.signedUrl(input);
    }
    return unboundResult("signedUrl", input.key);
  }
}
