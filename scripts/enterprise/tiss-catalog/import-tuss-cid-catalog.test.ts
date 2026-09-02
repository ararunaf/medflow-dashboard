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
import { parseCsv } from "./import-tuss-cid-catalog";

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
