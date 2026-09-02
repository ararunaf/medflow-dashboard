/**
 * Teste de integração real com unpdf — gera um PDF válido de verdade com
 * pdf-lib (não um byte-array inventado à mão) e confirma que
 * extractPdfText() extrai o texto real embutido. Sem isso, o teste anterior
 * (mockar a lib) provaria apenas que o mock funciona, não que a extração
 * de PDF real funciona.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractPdfText } from "../../../src/lib/rag/extract-pdf-text.ts";

async function buildPdf(pages: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pages) {
    const page = doc.addPage([400, 200]);
    page.drawText(text, { x: 20, y: 150, size: 16, font });
  }
  return doc.save();
}

describe("extractPdfText — F2-S1 (integração real com unpdf)", () => {
  it("extrai o texto de um PDF de uma página gerado de verdade", async () => {
    const bytes = await buildPdf(["Contrato Unimed Nacional 2026"]);
    const result = await extractPdfText(bytes);
    assert.equal(result.pageCount, 1);
    assert.match(result.text, /Contrato Unimed Nacional 2026/);
  });

  it("extrai texto de múltiplas páginas e reporta pageCount correto", async () => {
    const bytes = await buildPdf(["CLÁUSULA PRIMEIRA - DO OBJETO", "CLÁUSULA SEGUNDA - DA COBERTURA"]);
    const result = await extractPdfText(bytes);
    assert.equal(result.pageCount, 2);
    assert.match(result.text, /CLÁUSULA PRIMEIRA/);
    assert.match(result.text, /CLÁUSULA SEGUNDA/);
  });
});
