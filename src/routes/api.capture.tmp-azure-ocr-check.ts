/**
 * TEMPORÁRIO — chama o Azure Document Intelligence de verdade (não só
 * checa presença de credencial) com uma imagem PNG 1x1 mínima válida,
 * pelo caminho oficial (AzureDocumentIntelligenceAdapter → OCRProviderPort).
 * Custo real mínimo (1 página). Remover depois de confirmado.
 */
import { createFileRoute } from "@tanstack/react-router";
import { AzureDocumentIntelligenceAdapter } from "@/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter";

// PNG 200x200 branco válido — a imagem 1x1 original foi rejeitada pelo
// Azure com "Invalid request" (tamanho mínimo de imagem). Não precisa ter
// texto legível, só respeitar as dimensões mínimas que o Azure exige.
const MIN_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACEElEQVR4nO3SQQkAMAzAwPo3vaoIg3KnII/Mg8D8DuAmY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBaJBcLKBp7i8n+mAAAAAElFTkSuQmCC";

async function handle({ request }: { request: Request }): Promise<Response> {
  const secret = request.headers.get("x-capture-worker-secret");
  if (!secret || secret !== process.env.CAPTURE_PIPELINE_WORKER_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const adapter = new AzureDocumentIntelligenceAdapter();
  const config = await adapter.validateConfiguration();
  if (!config.ok) {
    return Response.json({ ok: false, stage: "config", errors: config.errors });
  }

  const fileBytes = Uint8Array.from(Buffer.from(MIN_PNG_BASE64, "base64"));
  const started = Date.now();
  const result = await adapter.process({
    contentType: "image/png",
    fileBytes,
    timeoutMs: 20_000,
  });

  return Response.json({
    ok: result.ok,
    tookMs: Date.now() - started,
    message: result.message,
    processingStatus: result.processing.status,
    errors: result.processing.errors,
    pageCount: result.output.structuredData
      ? Object.keys(result.output.structuredData as object).length
      : undefined,
  });
}

export const Route = createFileRoute("/api/capture/tmp-azure-ocr-check")({
  server: { handlers: { POST: handle } },
});
