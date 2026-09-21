/**
 * TEMPORÁRIO — chama o Azure Document Intelligence de verdade (não só
 * checa presença de credencial) com uma imagem PNG 1x1 mínima válida,
 * pelo caminho oficial (AzureDocumentIntelligenceAdapter → OCRProviderPort).
 * Custo real mínimo (1 página). Remover depois de confirmado.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  AzureDocumentIntelligenceAdapter,
  resolveAzureDocumentIntelligenceConfig,
} from "@/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter";

const AZURE_DOCUMENT_INTELLIGENCE_API_VERSION = "2024-11-30";

function maskEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    return `${url.protocol}//${url.hostname}${url.pathname}`;
  } catch {
    return `<invalid-url len=${endpoint.length}>`;
  }
}

// PNG 200x200 branco válido — a imagem 1x1 original foi rejeitada pelo
// Azure com "Invalid request" (tamanho mínimo de imagem). Não precisa ter
// texto legível, só respeitar as dimensões mínimas que o Azure exige.
const MIN_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAIAAAAiOjnJAAACEElEQVR4nO3SQQkAMAzAwPo3vaoIg3KnII/Mg8D8DuAmY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBYJY5EwFgljkTAWCWORMBaJBcLKBp7i8n+mAAAAAElFTkSuQmCC";

async function handle({ request }: { request: Request }): Promise<Response> {
  // Autenticado por variável de ambiente própria (TMP_DIAG_TOKEN), não pelo
  // CAPTURE_PIPELINE_WORKER_SECRET — esse também autentica o cron de produção
  // do pipeline de captura e não deve ser tocado por causa de um teste pontual.
  const secret = request.headers.get("x-capture-worker-secret");
  const expected = process.env.TMP_DIAG_TOKEN;
  if (!secret || !expected || secret !== expected) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("raw") === "1";

  const fileBytes = Uint8Array.from(Buffer.from(MIN_PNG_BASE64, "base64"));

  if (raw) {
    const config = resolveAzureDocumentIntelligenceConfig();
    if (!config) {
      return Response.json({ ok: false, stage: "config", error: "endpoint/key ausentes" });
    }
    const analyzeUrl = `${config.endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_DOCUMENT_INTELLIGENCE_API_VERSION}`;
    const started = Date.now();
    const res = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey,
        "Content-Type": "image/png",
      },
      body: fileBytes as unknown as BodyInit,
    });
    const bodyText = await res.text();
    let bodyJson: unknown = undefined;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      // keep raw text
    }
    return Response.json({
      tookMs: Date.now() - started,
      status: res.status,
      statusText: res.statusText,
      endpointResolved: maskEndpoint(config.endpoint),
      analyzeUrlPath: analyzeUrl.replace(config.endpoint, "<endpoint>"),
      apiKeyLength: config.apiKey.length,
      apiKeyHasWhitespace: /\s/.test(config.apiKey),
      endpointHasWhitespace: /\s/.test(config.endpoint),
      operationLocation: res.headers.get("operation-location"),
      responseBody: bodyJson ?? bodyText.slice(0, 2000),
    });
  }

  const adapter = new AzureDocumentIntelligenceAdapter();
  const config = await adapter.validateConfiguration();
  if (!config.ok) {
    return Response.json({ ok: false, stage: "config", errors: config.errors });
  }

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
