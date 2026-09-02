/**
 * Regressão do parser CSV do importador TUSS/CID-10 (TISS-02-DATA).
 *
 * Existe porque o parser antigo (`split(",")`) corrompia silenciosamente
 * qualquer linha cuja descrição real da ANS/DATASUS contivesse vírgula —
 * exatamente o tipo de erro que só aparece com o arquivo oficial de
 * produção, nunca com a amostra de 12 códigos usada em dev.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, parseTussJson } from "./import-tuss-cid-catalog";

describe("parseCsv — importador TUSS/CID-10", () => {
  it("faz parsing básico separado por vírgula", () => {
    const rows = parseCsv("tuss_code,name\n10101012,Consulta em consultório");
    assert.deepEqual(rows, [{ tuss_code: "10101012", name: "Consulta em consultório" }]);
  });

  it("preserva vírgula dentro de campo entre aspas", () => {
    const rows = parseCsv(
      'tuss_code,name\n40101010,"Ecocardiograma, transtorácico, com Doppler"',
    );
    assert.equal(rows[0].name, "Ecocardiograma, transtorácico, com Doppler");
  });

  it("resolve aspas escapadas (\"\") dentro de campo entre aspas", () => {
    const rows = parseCsv('cid_code,description\nA00,"Cólera ""clássica"""');
    assert.equal(rows[0].description, 'Cólera "clássica"');
  });

  it("detecta delimitador ; quando o cabeçalho usa ponto e vírgula (export DATASUS)", () => {
    const rows = parseCsv("cid_code;description;chapter\nA00;Cólera;Cap. I");
    assert.deepEqual(rows, [{ cid_code: "A00", description: "Cólera", chapter: "Cap. I" }]);
  });

  it("remove BOM UTF-8 do início do arquivo (comum em export do Excel)", () => {
    const withBom = "﻿tuss_code,name\n10101012,Consulta";
    const rows = parseCsv(withBom);
    assert.equal(Object.keys(rows[0])[0], "tuss_code");
  });

  it("ignora linhas em branco", () => {
    const rows = parseCsv("tuss_code,name\n10101012,Consulta\n\n\n20101015,Eletrocardiograma\n");
    assert.equal(rows.length, 2);
  });

  it("retorna vazio para conteúdo vazio", () => {
    assert.deepEqual(parseCsv(""), []);
  });
});

describe("parseTussJson — importador do formato JSON real da ANS (Tabela 22)", () => {
  it("mapeia id → tuss_code e display_name → name", () => {
    const json = JSON.stringify([
      {
        id: "10101012",
        source: "tuss-22",
        display_name: "Consulta em consultório",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-", fim_implantacao: "2011-03-06" },
      },
    ]);
    const rows = parseTussJson(json);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tuss_code, "10101012");
    assert.equal(rows[0].name, "Consulta em consultório");
  });

  it("marca status ativo e effective_to null quando fim_vigencia é '-'", () => {
    const json = JSON.stringify([
      {
        id: "10101012",
        source: "tuss-22",
        display_name: "Consulta em consultório",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.status, "active");
    assert.equal(row.effective_to, null);
    assert.equal(row.effective_from, "2009-02-13");
  });

  it("marca status inativo e preserva effective_to quando fim_vigencia é uma data real", () => {
    const json = JSON.stringify([
      {
        id: "40101010",
        source: "tuss-22",
        display_name: "Procedimento descontinuado",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "2018-01-01" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.status, "inactive");
    assert.equal(row.effective_to, "2018-01-01");
  });

  it("deriva group_code dos 2 primeiros dígitos do código, sem inventar categoria", () => {
    const json = JSON.stringify([
      {
        id: "40101010",
        source: "tuss-22",
        display_name: "Exame",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.group_code, "40");
    assert.equal(row.category, null);
  });

  it("marca ans_edition e source com base no arquivo real", () => {
    const json = JSON.stringify([
      {
        id: "40101010",
        source: "tuss-22",
        display_name: "Exame",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.ans_edition, "22");
    assert.equal(row.source, "ans-tuss-22");
  });

  it("nunca define requires_authorization=true a partir só da Tabela 22 (sem fonte para isso)", () => {
    const json = JSON.stringify([
      {
        id: "40101010",
        source: "tuss-22",
        display_name: "Exame",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.requires_authorization, false);
  });

  it("ignora registros sem id ou sem display_name", () => {
    const json = JSON.stringify([
      { id: "", source: "tuss-22", display_name: "X", extras: {} },
      { id: "40101010", source: "tuss-22", display_name: "", extras: {} },
      {
        id: "40101020",
        source: "tuss-22",
        display_name: "Válido",
        extras: { inicio_vigencia: "2009-02-13", fim_vigencia: "-" },
      },
    ]);
    const rows = parseTussJson(json);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].tuss_code, "40101020");
  });

  it("lança erro claro quando o conteúdo não é um array", () => {
    assert.throws(() => parseTussJson('{"id":"x"}'));
  });

  it("preserva nomes com acentuação UTF-8 corretos sem alterar encoding", () => {
    const json = JSON.stringify([
      {
        id: "30918090",
        source: "tuss-22",
        display_name: "Ablação percutânea por cateter para tratamento de arritmias cardíacas",
        extras: { inicio_vigencia: "2026-08-01", fim_vigencia: "-" },
      },
    ]);
    const [row] = parseTussJson(json);
    assert.equal(row.name, "Ablação percutânea por cateter para tratamento de arritmias cardíacas");
  });
});
