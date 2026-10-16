/**
 * Fotos de iPhone na captura — detecção de HEIC, rotação EXIF e decisão de
 * conversão (src/modules/capture/utils/image-normalize.ts). A parte de
 * canvas/decodificação roda no navegador e não é exercitada aqui.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  NORMALIZE_TARGET_BYTES,
  fitWithin,
  needsNormalization,
  readJpegOrientation,
  sniffImageFormat,
  toJpegName,
} from "@/modules/capture/utils/image-normalize";

function bytes(...parts: Array<number[] | string>): Uint8Array {
  const out: number[] = [];
  for (const part of parts) {
    if (typeof part === "string") for (const ch of part) out.push(ch.charCodeAt(0));
    else out.push(...part);
  }
  return new Uint8Array(out);
}

/** ftyp box: [size][ftyp][major][minor][compatíveis...] */
function ftyp(major: string, compatible: string[] = []): Uint8Array {
  const size = 16 + compatible.length * 4;
  return bytes([0, 0, 0, size], "ftyp", major, [0, 0, 0, 0], ...compatible, [0, 0, 0, 0]);
}

/** JPEG mínimo com segmento APP1/EXIF contendo só a tag Orientation. */
function jpegWithOrientation(orientation: number, little: boolean): Uint8Array {
  const u16 = (v: number) => (little ? [v & 0xff, v >> 8] : [v >> 8, v & 0xff]);
  const u32 = (v: number) =>
    little
      ? [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, v >>> 24]
      : [v >>> 24, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
  const tiff = [
    ...(little ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...u16(42),
    ...u32(8), // IFD0 logo após o cabeçalho
    ...u16(1), // 1 entrada
    ...u16(0x0112), // Orientation
    ...u16(3), // SHORT
    ...u32(1),
    ...u16(orientation),
    0,
    0,
    ...u32(0),
  ];
  const app1Len = 2 + 6 + tiff.length;
  return bytes(
    [0xff, 0xd8, 0xff, 0xe1, app1Len >> 8, app1Len & 0xff],
    "Exif",
    [0, 0],
    tiff,
    [0xff, 0xda, 0, 2],
  );
}

describe("sniffImageFormat", () => {
  it("reconhece HEIC pela marca principal e pelas compatíveis (iPhone)", () => {
    assert.equal(sniffImageFormat(ftyp("heic")), "heic");
    assert.equal(sniffImageFormat(ftyp("mif1", ["heic"])), "heic");
    assert.equal(sniffImageFormat(ftyp("isom", ["mp41"])), null); // vídeo MP4 não é HEIC
  });

  it("reconhece os formatos aceitos pelo servidor", () => {
    assert.equal(sniffImageFormat(bytes("%PDF-1.7", [0, 0, 0, 0])), "pdf");
    assert.equal(
      sniffImageFormat(bytes([0xff, 0xd8, 0xff, 0xe0], [0, 0, 0, 0, 0, 0, 0, 0])),
      "jpeg",
    );
    assert.equal(sniffImageFormat(bytes([0x89], "PNG", [13, 10, 26, 10, 0, 0, 0, 0])), "png");
    assert.equal(sniffImageFormat(bytes("RIFF", [0, 0, 0, 0], "WEBP")), "webp");
    assert.equal(sniffImageFormat(bytes("II*", [0], [0, 0, 0, 0, 0, 0, 0, 0])), "tiff");
  });
});

describe("readJpegOrientation", () => {
  it("lê a orientação da foto de iPhone em pé (6) nos dois endianness", () => {
    assert.equal(readJpegOrientation(jpegWithOrientation(6, false)), 6);
    assert.equal(readJpegOrientation(jpegWithOrientation(6, true)), 6);
    assert.equal(readJpegOrientation(jpegWithOrientation(1, false)), 1);
  });

  it("devolve 1 sem EXIF, em arquivo que não é JPEG ou com valor inválido", () => {
    assert.equal(readJpegOrientation(bytes([0xff, 0xd8, 0xff, 0xda, 0, 2])), 1);
    assert.equal(readJpegOrientation(bytes("%PDF-1.7")), 1);
    assert.equal(readJpegOrientation(jpegWithOrientation(42, true)), 1);
  });
});

describe("needsNormalization", () => {
  it("converte sempre HEIC, foto deitada e JPEG acima do limite do OCR", () => {
    assert.equal(needsNormalization({ format: "heic", byteLength: 900_000, orientation: 1 }), true);
    assert.equal(needsNormalization({ format: "jpeg", byteLength: 900_000, orientation: 6 }), true);
    assert.equal(
      needsNormalization({
        format: "jpeg",
        byteLength: NORMALIZE_TARGET_BYTES + 1,
        orientation: 1,
      }),
      true,
    );
  });

  it("deixa como está JPEG pequeno em pé, PDF e TIFF", () => {
    assert.equal(
      needsNormalization({ format: "jpeg", byteLength: 900_000, orientation: 1 }),
      false,
    );
    assert.equal(
      needsNormalization({ format: "pdf", byteLength: 20_000_000, orientation: 1 }),
      false,
    );
    assert.equal(
      needsNormalization({ format: "tiff", byteLength: 9_000_000, orientation: 1 }),
      false,
    );
  });
});

describe("fitWithin e toJpegName", () => {
  it("reduz a foto de 12 MP do iPhone mantendo a proporção", () => {
    assert.deepEqual(fitWithin(4032, 3024, 2800), { width: 2800, height: 2100 });
    assert.deepEqual(fitWithin(3024, 4032, 2800), { width: 2100, height: 2800 });
    assert.deepEqual(fitWithin(1200, 1600, 2800), { width: 1200, height: 1600 });
  });

  it("troca a extensão por .jpg", () => {
    assert.equal(toJpegName("IMG_1234.HEIC"), "IMG_1234.jpg");
    assert.equal(toJpegName("guia.consulta.png"), "guia.consulta.jpg");
    assert.equal(toJpegName("sem-extensao"), "sem-extensao.jpg");
  });
});
