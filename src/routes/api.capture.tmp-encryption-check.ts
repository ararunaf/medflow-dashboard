/**
 * TEMPORÁRIO — verifica se MEDFLOW_STORAGE_ENCRYPTION_KEY configurada no
 * Vercel de produção é válida e produz um round-trip funcional. Nunca
 * expõe o valor da chave nem de nenhum conteúdo real. Remover depois de
 * confirmado.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  decryptStorageBytes,
  encryptStorageBytes,
  isStorageEncryptionConfigured,
} from "@/lib/security/storage-encryption";

async function handle({ request }: { request: Request }): Promise<Response> {
  const secret = request.headers.get("x-capture-worker-secret");
  if (!secret || secret !== process.env.CAPTURE_PIPELINE_WORKER_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isStorageEncryptionConfigured()) {
    return Response.json({ ok: false, error: "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada" });
  }

  try {
    const plaintext = new TextEncoder().encode(`round-trip-check-${Date.now()}`);
    const encrypted = await encryptStorageBytes(plaintext);
    const decrypted = await decryptStorageBytes(encrypted);
    const roundTripOk =
      decrypted.length === plaintext.length && decrypted.every((b, i) => b === plaintext[i]);
    return Response.json({
      ok: true,
      configured: true,
      roundTripOk,
      markerByte: encrypted[0],
      encryptedLength: encrypted.length,
    });
  } catch (err) {
    return Response.json({
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export const Route = createFileRoute("/api/capture/tmp-encryption-check")({
  server: { handlers: { POST: handle } },
});
