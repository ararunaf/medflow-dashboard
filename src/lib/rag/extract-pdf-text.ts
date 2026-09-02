/**
 * Extração de texto de PDF — F2-S1 (Ingestão de contrato e pipeline RAG).
 *
 * Wrapper fino sobre `unpdf` (pdf.js compilado para ambiente serverless).
 * Nenhuma lógica de domínio aqui — apenas texto bruto por página.
 */
import { extractText, getDocumentProxy } from "unpdf";

export type ExtractedPdfText = {
  pageCount: number;
  text: string;
};

export async function extractPdfText(data: Uint8Array): Promise<ExtractedPdfText> {
  const pdf = await getDocumentProxy(data);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { pageCount: totalPages, text };
}
