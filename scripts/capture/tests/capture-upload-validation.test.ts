/**
 * F1-S3 — verificação automática de arquivos no datalake (magic bytes).
 *
 * Antes desta sprint, `validateCaptureUpload` só conferia mime type
 * declarado, tamanho e nome — nunca o conteúdo real do arquivo. Um upload
 * com Content-Type mentiroso ou um arquivo truncado/corrompido passava
 * direto para o Storage e disparava OCR sobre lixo.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ValidationError } from "@/lib/domain/operations/errors";
import { validateCaptureUpload } from "@/lib/capture/infrastructure/storage-paths";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function withPadding(header: number[], totalLength = 32): Uint8Array {
  const out = new Uint8Array(totalLength);
  out.set(header, 0);
  return out;
}

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const JPEG_HEADER = [0xff, 0xd8, 0xff];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const TIFF_LE_HEADER = [0x49, 0x49, 0x2a, 0x00];
const TIFF_BE_HEADER = [0x4d, 0x4d, 0x00, 0x2a];

function webpBytes(): Uint8Array {
  const out = new Uint8Array(16);
  out.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  out.set([0x00, 0x00, 0x00, 0x00], 4); // tamanho (irrelevante para a checagem)
  out.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  return out;
}

function baseInput(mimeType: string, fileBytes: Uint8Array) {
  return {
    mimeType,
    byteLength: fileBytes.length,
    filename: "documento.bin",
    fileBytes,
  };
}

describe("validateCaptureUpload — assinatura binária (magic bytes)", () => {
  it("aceita PDF com header real", () => {
    assert.doesNotThrow(() =>
      validateCaptureUpload(baseInput("application/pdf", withPadding(PDF_HEADER))),
    );
  });

  it("aceita JPEG com header real", () => {
    assert.doesNotThrow(() =>
      validateCaptureUpload(baseInput("image/jpeg", withPadding(JPEG_HEADER))),
    );
  });

  it("aceita PNG com header real", () => {
    assert.doesNotThrow(() =>
      validateCaptureUpload(baseInput("image/png", withPadding(PNG_HEADER))),
    );
  });

  it("aceita WEBP com header RIFF/WEBP real", () => {
    assert.doesNotThrow(() => validateCaptureUpload(baseInput("image/webp", webpBytes())));
  });

  it("aceita TIFF little-endian e big-endian", () => {
    assert.doesNotThrow(() =>
      validateCaptureUpload(baseInput("image/tiff", withPadding(TIFF_LE_HEADER))),
    );
    assert.doesNotThrow(() =>
      validateCaptureUpload(baseInput("image/tiff", withPadding(TIFF_BE_HEADER))),
    );
  });

  it("rejeita Content-Type mentiroso — bytes de PNG declarados como PDF", () => {
    assert.throws(
      () => validateCaptureUpload(baseInput("application/pdf", withPadding(PNG_HEADER))),
      ValidationError,
    );
  });

  it("rejeita arquivo truncado/corrompido (header incompleto)", () => {
    assert.throws(
      () => validateCaptureUpload(baseInput("application/pdf", bytes(0x25, 0x50))),
      ValidationError,
    );
  });

  it("rejeita arquivo vazio", () => {
    assert.throws(
      () => validateCaptureUpload(baseInput("image/jpeg", bytes())),
      ValidationError,
    );
  });

  it("rejeita quando byteLength declarado não bate com o tamanho real recebido", () => {
    const fileBytes = withPadding(PDF_HEADER);
    assert.throws(
      () =>
        validateCaptureUpload({
          mimeType: "application/pdf",
          byteLength: fileBytes.length + 100,
          filename: "documento.pdf",
          fileBytes,
        }),
      ValidationError,
    );
  });

  it("continua rejeitando mime type fora da lista permitida", () => {
    assert.throws(
      () => validateCaptureUpload(baseInput("application/zip", withPadding(PDF_HEADER))),
      ValidationError,
    );
  });

  it("continua rejeitando nome de arquivo vazio", () => {
    const fileBytes = withPadding(PDF_HEADER);
    assert.throws(
      () =>
        validateCaptureUpload({
          mimeType: "application/pdf",
          byteLength: fileBytes.length,
          filename: "   ",
          fileBytes,
        }),
      ValidationError,
    );
  });
});
