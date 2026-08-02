/**
 * In-memory StorageProviderBackend — usado por mock/default sem I/O externo.
 * Reutilizado pelo Default adapter quando nenhum backend Supabase é injetado.
 */
import type { StorageProviderBackend } from "../ports/types";

type StoredObject = {
  body: Uint8Array;
  contentType?: string;
  etag: string;
  lastModified: string;
};

export function createInMemoryStorageBackend(): StorageProviderBackend {
  const objects = new Map<string, StoredObject>();

  function objectKey(container: string | undefined, key: string): string {
    return `${container ?? "default"}::${key}`;
  }

  return {
    async upload(input) {
      const etag = `mem-${input.body.byteLength}-${Date.now()}`;
      const lastModified = new Date().toISOString();
      objects.set(objectKey(input.container, input.key), {
        body: input.body,
        contentType: input.contentType,
        etag,
        lastModified,
      });
      return { ok: true, etag, message: "stored in memory" };
    },
    async download(input) {
      const stored = objects.get(objectKey(input.container, input.key));
      if (!stored) return { ok: false, message: "not found" };
      return {
        ok: true,
        body: stored.body,
        contentType: stored.contentType,
        message: "ok",
      };
    },
    async delete(input) {
      const existed = objects.delete(objectKey(input.container, input.key));
      return { ok: existed, message: existed ? "deleted" : "not found" };
    },
    async metadata(input) {
      const stored = objects.get(objectKey(input.container, input.key));
      if (!stored) return { ok: false, message: "not found" };
      return {
        ok: true,
        contentType: stored.contentType,
        sizeBytes: stored.body.byteLength,
        etag: stored.etag,
        lastModified: stored.lastModified,
        message: "ok",
      };
    },
    async signedUrl(input) {
      const stored = objects.get(objectKey(input.container, input.key));
      if (!stored) return { ok: false, message: "not found" };
      const expiresInSeconds = input.expiresInSeconds ?? 3600;
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return {
        ok: true,
        url: `memory://${encodeURIComponent(input.key)}?exp=${expiresInSeconds}`,
        expiresAt,
        message: "ok",
      };
    },
    async publicUrl(input) {
      const stored = objects.get(objectKey(input.container, input.key));
      if (!stored) return { ok: false, message: "not found" };
      return {
        ok: true,
        url: `memory-public://${encodeURIComponent(input.key)}`,
        message: "ok",
      };
    },
    async health() {
      return { ok: true, message: "in-memory storage backend ready" };
    },
  };
}
