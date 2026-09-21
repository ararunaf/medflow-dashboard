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

// PNG 32x32 real (favicon do próprio app) — os PNGs hand-rolled (1x1 e
// 200x200) eram aceitos pelo Azure (202) mas rejeitados na análise como
// "UnsupportedContent: image content is corrupted" — a codificação manual
// do IDAT/zlib estava incorreta.
const MIN_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAsTAAALEwEAmpwYAAACnUlEQVR42u2WTUhUURTHz7n3vXlvxpkmJ0wD06QwHcsSMrVFUEgEkpoUBG1qVess2rRz41poGUQRFBRSDRS2yEJsYVQzlk1+QDbaTH7Me86baZz33r23xQS1cKY0hSLP4qzu4cc5//M/XPQW+2Etg8AaxzrgPwAg5/zf7kD6/acChBAACPg9rSpACIGEEMySQHCOiKsJIIi6aaYZAwSFUp8ki9XqgAtBCRmej7c+69clQFVSHdL9usZ6r89iTCLkj0QWApgAAAhr+kdNS9iWwayooY8saAAgALkQKwdki7NzJwCQymA6QywOJnNRaSKVGJiNUULsvIueb0SUoBAgOABAJm0e21Yhe5Te6QgAy6QyI4b+Nr5QSjZUbnbz3JovbTTOBaXkyavpi7deO5yKMTd/pcN/4kgNM3l7IBBK6ufVspnYomGLBCPnmne31G1lnJOlGCTHygMAPHw+FhqceDk4SuPaoYaK2s7uM9fudO6tbUV3MqL1vwgXK46ZKX0gFPlRsywNiDCBLkI8euHkngfBd2OPxu/1BRWXUic8wQ9T85r5fjS6RSX+Yg8A5HIeybk9AJDUIRT0+9iBpu3dPX1QWiksz9kbvUNfZl0IDWWqnZjzUktGtuwOsoq1Ne863FLd03XqauCNA92yjGDRmYFYYHB8NrXotK2jjVXh8ETk02fITch/TTE4qd1+Olzuc5e45Y7L12mhhwowE8bNrtM7aopcxFHuLJBUucCpiByGyO9kvrPEfen4vk0bXXcfD8HXBFEQJQp22kUgo8hocm+h2+Zc5LablPd8oqpIskwAAC0TYlPMTHFJhgUjlTQ6ikosmzHGKcEVGg1/yk31Ve1tjdF4EiXZV+g5uL8aABCBkF/cVFx/eK0D/n7AN5kCI/noVuzaAAAAAElFTkSuQmCC";

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
  const poll = url.searchParams.get("raw") === "2";

  const fileBytes = Uint8Array.from(Buffer.from(MIN_PNG_BASE64, "base64"));

  if (poll) {
    const config = resolveAzureDocumentIntelligenceConfig();
    if (!config) {
      return Response.json({ ok: false, stage: "config", error: "endpoint/key ausentes" });
    }
    const analyzeUrl = `${config.endpoint}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${AZURE_DOCUMENT_INTELLIGENCE_API_VERSION}`;
    const submitRes = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey,
        "Content-Type": "image/png",
      },
      body: fileBytes as unknown as BodyInit,
    });
    if (submitRes.status !== 202) {
      const errBody = await submitRes.text();
      return Response.json({ stage: "submit", status: submitRes.status, body: errBody });
    }
    const operationLocation = submitRes.headers.get("operation-location");
    if (!operationLocation) {
      return Response.json({ stage: "submit", error: "sem operation-location" });
    }

    const attempts: unknown[] = [];
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const pollRes = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": config.apiKey },
      });
      const pollBody = (await pollRes.json().catch(() => ({}))) as {
        status?: string;
        error?: unknown;
      };
      attempts.push({
        i,
        httpStatus: pollRes.status,
        azureStatus: pollBody.status,
        error: pollBody.error,
      });
      if (pollBody.status === "succeeded" || pollBody.status === "failed") {
        return Response.json({ operationLocation, attempts });
      }
    }
    return Response.json({ operationLocation, attempts, timedOut: true });
  }

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
