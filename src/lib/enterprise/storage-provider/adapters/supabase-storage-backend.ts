/**
 * Supabase Storage Backend — STORAGE-01.
 *
 * Reutiliza a integração homologada (clinical-documents bucket).
 * Único ponto autorizado de I/O Supabase Storage no produto.
 * NÃO cria implementação paralela — encapsula o mesmo padrão legado.
 */
import type { StorageProviderBackend } from "../ports/types";

/** Bucket homologado da Captura Inteligente / documentos clínicos. */
export const DEFAULT_STORAGE_PROVIDER_BUCKET = "clinical-documents";

/**
 * Cliente mínimo compatível com Supabase Storage API usada pelo produto.
 * Evita acoplar o Adapter ao tipo Database genérico do ServiceCtx.
 */
export type SupabaseStorageClientLike = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Uint8Array,
        options?: { contentType?: string; upsert?: boolean },
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
      download: (path: string) => Promise<{ data: Blob | null; error: { message: string } | null }>;
      remove: (paths: string[]) => Promise<{ data: unknown; error: { message: string } | null }>;
      createSignedUrl: (
        path: string,
        expiresIn: number,
        options?: { download?: string | boolean },
      ) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
      list?: (
        path?: string,
        options?: { search?: string; limit?: number },
      ) => Promise<{
        data: Array<{
          name: string;
          metadata?: { size?: number; mimetype?: string; eTag?: string } | null;
          updated_at?: string;
        }> | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function toUint8ArrayFromBlob(blob: Blob): Promise<Uint8Array> {
  return blob.arrayBuffer().then((buf) => new Uint8Array(buf));
}

/**
 * Cria o backend Supabase a partir do client homologado (ServiceCtx.client).
 */
export function createSupabaseStorageBackend(
  client: SupabaseStorageClientLike,
  defaultBucket: string = DEFAULT_STORAGE_PROVIDER_BUCKET,
): StorageProviderBackend {
  return {
    async upload(input) {
      const bucket = input.container ?? defaultBucket;
      const { error } = await client.storage.from(bucket).upload(input.key, input.body, {
        contentType: input.contentType,
        upsert: input.upsert ?? true,
      });
      if (error) return { ok: false, message: error.message };
      return {
        ok: true,
        etag: `supabase-${input.body.byteLength}`,
        message: "uploaded via supabase storage",
      };
    },
    async download(input) {
      const bucket = input.container ?? defaultBucket;
      const { data, error } = await client.storage.from(bucket).download(input.key);
      if (error || !data) {
        return { ok: false, message: error?.message ?? "not found" };
      }
      const body = await toUint8ArrayFromBlob(data);
      return {
        ok: true,
        body,
        contentType: data.type || undefined,
        message: "downloaded via supabase storage",
      };
    },
    async delete(input) {
      const bucket = input.container ?? defaultBucket;
      const { error } = await client.storage.from(bucket).remove([input.key]);
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: "deleted via supabase storage" };
    },
    async metadata(input) {
      const bucket = input.container ?? defaultBucket;
      const slash = input.key.lastIndexOf("/");
      const folder = slash >= 0 ? input.key.slice(0, slash) : "";
      const fileName = slash >= 0 ? input.key.slice(slash + 1) : input.key;
      const list = client.storage.from(bucket).list;
      if (!list) {
        // Fallback: tentativa de download leve via existência
        const { data, error } = await client.storage.from(bucket).download(input.key);
        if (error || !data) {
          return { ok: false, message: error?.message ?? "not found" };
        }
        const body = await toUint8ArrayFromBlob(data);
        return {
          ok: true,
          contentType: data.type || undefined,
          sizeBytes: body.byteLength,
          message: "metadata via download probe",
        };
      }
      const { data, error } = await list(folder, { search: fileName, limit: 100 });
      if (error) return { ok: false, message: error.message };
      const match = (data ?? []).find((row) => row.name === fileName);
      if (!match) return { ok: false, message: "not found" };
      return {
        ok: true,
        contentType: match.metadata?.mimetype ?? undefined,
        sizeBytes: match.metadata?.size,
        etag: match.metadata?.eTag,
        lastModified: match.updated_at,
        message: "metadata via supabase storage",
      };
    },
    async signedUrl(input) {
      const bucket = input.container ?? defaultBucket;
      const expiresInSeconds = input.expiresInSeconds ?? 3600;
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(
          input.key,
          expiresInSeconds,
          input.downloadFilename ? { download: input.downloadFilename } : undefined,
        );
      if (error || !data?.signedUrl) {
        return { ok: false, message: error?.message ?? "signed url failed" };
      }
      return {
        ok: true,
        url: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        message: "signed url via supabase storage",
      };
    },
    async publicUrl(input) {
      const bucket = input.container ?? defaultBucket;
      const { data } = client.storage.from(bucket).getPublicUrl(input.key);
      if (!data?.publicUrl) return { ok: false, message: "public url unavailable" };
      return { ok: true, url: data.publicUrl, message: "public url via supabase storage" };
    },
    async health() {
      return { ok: true, message: "supabase storage backend bound" };
    },
  };
}
