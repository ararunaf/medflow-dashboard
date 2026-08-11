/**
 * EPC-24D — TISS/XML Export → XML Generation / XML-TISS Runtime (convergência).
 *
 * Fluxo oficial:
 *   Produto → resolveCaptureEnterpriseRuntime() [= getEnterpriseRuntime()]
 *     → XMLGenerationRuntimePort (coordenação estrutural TISS-05)
 *     → XMLTISSRuntimePort (coordenação estrutural C-01)
 *     → fallback legado `xml-export-service` (comportamento funcional idêntico)
 *
 * Sem cutover. Sem alteração de regra TISS / UI / banco / APIs.
 * Foundations 4–7 preservadas. Builder `medflowTissExport` permanece como
 * fallback até EPC-24E (paridade + remoção).
 *
 * Nenhum módulo de produto deve importar `xml-export-service` para execução —
 * apenas este módulo (e testes do próprio TISS XML).
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  buildTissBatchXmlDocument,
  exportTissBatchXml,
  listTissBatchExports,
} from "@/lib/services/tiss/xml-export-service";
import { resolveCaptureEnterpriseRuntime } from "./resolve-enterprise-runtime";

export type ExportTissBatchXmlViaEnterpriseResult = {
  xml: string;
  exportId: string;
  viaEnterpriseRuntime: true;
  generationId: string | null;
  xmlTissDocumentId: string | null;
  xmlFallback: "legacy-xml-export-service";
};

export type CaptureXmlViaEnterpriseProbe = {
  runtimeId: string;
  entry: "getEnterpriseRuntime";
  xmlGenerationRuntimeOk: boolean;
  xmlTissRuntimeOk: boolean;
  xmlRuntimeOk: boolean;
  providerId: string;
};

/**
 * Probe estrutural: produto alcança XML Generation / XML-TISS / XML Runtime.
 * Best-effort; nunca lança.
 */
export async function probeCaptureXmlViaEnterprise(): Promise<CaptureXmlViaEnterpriseProbe | null> {
  try {
    const runtime = resolveCaptureEnterpriseRuntime();
    const generation = runtime.getXMLGenerationRuntimePort();
    const xmlTiss = runtime.getXMLTISSRuntimePort();
    const xml = runtime.getXMLRuntimePort();
    const [genHealth, tissHealth, xmlHealth] = await Promise.all([
      generation.health(),
      xmlTiss.health(),
      xml.health(),
    ]);
    return {
      runtimeId: runtime.runtimeId,
      entry: "getEnterpriseRuntime",
      xmlGenerationRuntimeOk: genHealth.ok,
      xmlTissRuntimeOk: tissHealth.ok,
      xmlRuntimeOk: xmlHealth.ok,
      providerId: generation.providerId,
    };
  } catch {
    return null;
  }
}

/**
 * Coordena geração XML via Ports Enterprise e executa o export legado
 * como fallback funcional (mesmo XML / mesmos side-effects de persistência).
 */
export async function exportTissBatchXmlViaEnterprise(
  ctx: ServiceCtx,
  batchId: string,
): Promise<ExportTissBatchXmlViaEnterpriseResult> {
  const runtime = resolveCaptureEnterpriseRuntime();
  const generation = runtime.getXMLGenerationRuntimePort();
  const xmlTiss = runtime.getXMLTISSRuntimePort();

  let generationId: string | null = null;
  let xmlTissDocumentId: string | null = null;

  try {
    const generated = await generation.generate({
      requestId: `tiss-xml-gen-${batchId}`,
      generationId: `tiss-xml-gen-${batchId}`,
      documentId: batchId,
      request: {
        kind: "canonical-xml-generation-request",
        requestId: `tiss-xml-gen-${batchId}`,
        generationId: `tiss-xml-gen-${batchId}`,
        documentId: batchId,
        structuralNotes: `epc-24d-tiss-xml-export:${batchId}`,
        metadata: {
          kind: "canonical-xml-metadata",
          correlationId: batchId,
          channel: "epc-24d-tiss-xml",
          tags: ["epc-24d", "xml", "tiss"],
          customAttributes: { batchId, stage: "xml-export" },
        },
      },
    });
    generationId = generated.result?.generationId ?? generated.result?.resultId ?? null;
  } catch {
    /* coordenação estrutural best-effort — fallback legado permanece */
  }

  try {
    const prepared = await xmlTiss.prepareXMLDocument({
      requestId: `tiss-xml-tiss-${batchId}`,
      documentId: batchId,
    });
    xmlTissDocumentId = prepared.document?.documentId ?? null;
  } catch {
    /* coordenação XML-TISS estrutural best-effort */
  }

  const legacy = await exportTissBatchXml(ctx, batchId);
  return {
    ...legacy,
    viaEnterpriseRuntime: true,
    generationId,
    xmlTissDocumentId,
    xmlFallback: "legacy-xml-export-service",
  };
}

/**
 * Build XML (leitura) — facade Enterprise; legado permanece a fonte do documento.
 */
export async function buildTissBatchXmlDocumentViaEnterprise(
  ctx: ServiceCtx,
  batchId: string,
): Promise<string> {
  void resolveCaptureEnterpriseRuntime();
  return buildTissBatchXmlDocument(ctx, batchId);
}

/**
 * Listagem de exports — facade Enterprise (sem reexecução).
 */
export async function listTissBatchExportsViaEnterprise(
  ctx: ServiceCtx,
  batchId: string,
): Promise<Awaited<ReturnType<typeof listTissBatchExports>>> {
  void resolveCaptureEnterpriseRuntime();
  return listTissBatchExports(ctx, batchId);
}
