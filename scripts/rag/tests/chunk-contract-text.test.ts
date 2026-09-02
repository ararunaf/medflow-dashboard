import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chunkContractText } from "../../../src/lib/rag/chunk-contract-text.ts";

describe("chunkContractText — F2-S1", () => {
  it("retorna vazio para texto vazio ou só espaços", () => {
    assert.deepEqual(chunkContractText(""), []);
    assert.deepEqual(chunkContractText("   \n\n  "), []);
  });

  it("divide por cláusula quando o contrato expõe marcadores reais (CLÁUSULA)", () => {
    const text = [
      "CONTRATO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS",
      "",
      "CLÁUSULA PRIMEIRA - DO OBJETO",
      "O presente contrato tem por objeto a prestação de serviços médicos",
      "pela cooperativa à operadora contratante, conforme rede credenciada.",
      "",
      "CLÁUSULA SEGUNDA - DA COBERTURA",
      "A cobertura abrange consultas, exames e internações eletivas, com",
      "prazo de carência de 180 dias para procedimentos de alta complexidade.",
      "",
      "CLÁUSULA TERCEIRA - DO REAJUSTE",
      "Os valores serão reajustados anualmente pelo índice IGPM-FGV.",
    ].join("\n");

    const chunks = chunkContractText(text);

    // Preâmbulo antes da primeira cláusula ("CONTRATO DE PRESTAÇÃO...") vira
    // seu próprio chunk sem heading — conteúdo real, só sem cláusula-fonte.
    assert.equal(chunks.length, 4);
    assert.equal(chunks[0]!.heading, null);
    assert.match(chunks[0]!.content, /CONTRATO DE PRESTAÇÃO DE SERVIÇOS/);
    assert.match(chunks[1]!.heading ?? "", /CLÁUSULA PRIMEIRA/i);
    assert.match(chunks[1]!.content, /objeto a prestação de serviços/);
    assert.match(chunks[2]!.heading ?? "", /CLÁUSULA SEGUNDA/i);
    assert.match(chunks[2]!.content, /carência de 180 dias/);
    assert.match(chunks[3]!.heading ?? "", /CLÁUSULA TERCEIRA/i);
  });

  it("reconhece PARÁGRAFO e ARTIGO como marcadores de cláusula", () => {
    const text = [
      "Art. 1 - Este contrato regula a prestação de serviços.",
      "Texto do artigo primeiro com o detalhamento necessário.",
      "",
      "Parágrafo único - Aplica-se subsidiariamente a legislação da ANS.",
      "Texto complementar do parágrafo único.",
    ].join("\n");

    const chunks = chunkContractText(text);
    assert.equal(chunks.length, 2);
    assert.match(chunks[0]!.heading ?? "", /Art\. 1/);
    assert.match(chunks[1]!.heading ?? "", /Parágrafo único/i);
  });

  it("reconhece seção numerada em caixa alta (ex.: '3.1 COBERTURA DE CONSULTAS')", () => {
    const text = [
      "3.1 COBERTURA DE CONSULTAS",
      "Consultas eletivas cobertas sem limite de quantidade mensal.",
      "",
      "3.2 COBERTURA DE EXAMES",
      "Exames laboratoriais e de imagem conforme tabela TUSS vigente.",
    ].join("\n");

    const chunks = chunkContractText(text);
    assert.equal(chunks.length, 2);
    assert.match(chunks[0]!.heading ?? "", /3\.1 COBERTURA DE CONSULTAS/);
    assert.match(chunks[1]!.heading ?? "", /3\.2 COBERTURA DE EXAMES/);
  });

  it("cai para chunking por parágrafo quando não há marcador de cláusula reconhecível", () => {
    const text = [
      "Este é um texto de contrato mal digitalizado, sem estrutura clara",
      "de cláusulas — apenas parágrafos corridos vindos de OCR de baixa",
      "qualidade que não preservou os títulos das seções originais.",
      "",
      "Segundo parágrafo do mesmo documento, também sem título reconhecível,",
      "mas que ainda assim precisa ser indexado e pesquisável de alguma forma.",
    ].join("\n");

    const chunks = chunkContractText(text);
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0]!.heading, null);
    assert.match(chunks[0]!.content, /mal digitalizado/);
    assert.match(chunks[0]!.content, /Segundo parágrafo/);
  });

  it("não trata uma única ocorrência de marcador como divisão por cláusula (exige >=2)", () => {
    const text = [
      "CLÁUSULA PRIMEIRA - DO OBJETO",
      "Texto único do contrato, sem uma segunda cláusula identificável",
      "no restante do documento — mistura de título e corpo corrido.",
    ].join("\n");

    const chunks = chunkContractText(text);
    // Só 1 marcador encontrado => cai no fallback por parágrafo (heading null).
    assert.equal(chunks.every((c) => c.heading === null), true);
  });

  it("subdivide cláusula muito longa em múltiplos chunks com sobreposição, preservando o heading", () => {
    const longBody = Array.from({ length: 200 }, (_, i) => `frase número ${i} do corpo da cláusula`).join(". ");
    const text = [
      "CLÁUSULA PRIMEIRA - DO OBJETO",
      longBody,
      "",
      "CLÁUSULA SEGUNDA - DA COBERTURA",
      "Corpo curto da segunda cláusula.",
    ].join("\n");

    const chunks = chunkContractText(text);
    const firstClauseChunks = chunks.filter((c) => c.heading?.includes("PRIMEIRA"));
    assert.ok(firstClauseChunks.length > 1, "cláusula longa deve gerar mais de um chunk");
    for (const c of firstClauseChunks) {
      assert.ok(c.content.length <= 1800);
    }
    // Sobreposição real: o fim de um chunk aparece no início do próximo.
    const [first, second] = firstClauseChunks;
    const tailOfFirst = first!.content.slice(-100);
    assert.ok(second!.content.startsWith(tailOfFirst.slice(0, 50)) || second!.content.includes(tailOfFirst.slice(0, 30)));
  });

  it("chunks têm índice sequencial crescente cobrindo o documento inteiro", () => {
    const text = [
      "CLÁUSULA PRIMEIRA - A",
      "corpo a",
      "",
      "CLÁUSULA SEGUNDA - B",
      "corpo b",
    ].join("\n");
    const chunks = chunkContractText(text);
    assert.deepEqual(
      chunks.map((c) => c.index),
      chunks.map((_, i) => i),
    );
  });
});
